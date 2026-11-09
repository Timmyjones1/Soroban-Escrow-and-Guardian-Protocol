"use client";

import React, { useState } from "react";
import { Plus, Trash2, X, AlertCircle } from "lucide-react";
import { SUPPORTED_ASSETS, STELLAR_CONFIG } from "@/config/stellar";
import { TxSimulationPreview } from "./TxSimulationPreview";

interface MilestoneRow {
  description: string;
  amount: string;
  deadlineDays: number;
}

interface CreateEscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientAddress: string | null;
}

export function CreateEscrowModal({
  isOpen,
  onClose,
  onSuccess,
  clientAddress,
}: CreateEscrowModalProps) {
  const [title, setTitle] = useState("");
  const [contractor, setContractor] = useState("");
  const [arbiter, setArbiter] = useState("GBPOLARISARBITERXXXXXXXXXXXXXTESTNET01");
  const [selectedAsset, setSelectedAsset] = useState(SUPPORTED_ASSETS[0]);
  const [milestones, setMilestones] = useState<MilestoneRow[]>([
    { description: "Milestone 1: Prototype Delivery", amount: "1000", deadlineDays: 14 },
    { description: "Milestone 2: Production Hardening", amount: "1500", deadlineDays: 30 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAmount = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      { description: `Milestone ${prev.length + 1}`, amount: "500", deadlineDays: 14 },
    ]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof MilestoneRow, val: any) => {
    setMilestones((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!contractor.startsWith("G") || contractor.length !== 56) {
      setError("Contractor address must be a valid 56-character Stellar public key (G...)");
      return;
    }

    setIsSubmitting(true);
    try {
      // In production, invokes `stellar contract invoke -- create_escrow`
      // Call backend indexer simulation endpoint
      const payload = {
        id: Date.now(),
        client: clientAddress || "GBDEMOEMPLOYER",
        contractor,
        arbiter,
        token: selectedAsset.contractId,
        total_amount: Math.round(totalAmount * 10_000_000),
        remaining_balance: Math.round(totalAmount * 10_000_000),
        released_amount: 0,
        status: "active",
        milestones: milestones.map((m, idx) => ({
          index: idx,
          description: m.description,
          amount: Math.round((parseFloat(m.amount) || 0) * 10_000_000),
          deadline: Math.floor(Date.now() / 1000) + m.deadlineDays * 86400,
          status: "pending",
          proof_hash: "",
          submitted_at: 0,
          approved_at: 0,
        })),
        created_at: Math.floor(Date.now() / 1000),
        title,
      };

      await fetch(`${STELLAR_CONFIG.backendUrl}/api/v1/escrows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit transaction to Stellar Testnet");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-polaris-card border border-polaris-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-1">Create Programmable Escrow</h2>
        <p className="text-xs text-slate-400 mb-6">
          Lock funds into a Soroban milestone contract with deterministic release conditions.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Project Agreement Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cross-Border Smart Contract Audit"
              className="w-full bg-slate-900 border border-polaris-border rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contractor Address (G...)</label>
              <input
                type="text"
                required
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                placeholder="G..."
                className="w-full bg-slate-900 border border-polaris-border rounded-xl px-3 py-2 text-white placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Payment Asset</label>
              <select
                value={selectedAsset.code}
                onChange={(e) => {
                  const a = SUPPORTED_ASSETS.find((x) => x.code === e.target.value);
                  if (a) setSelectedAsset(a);
                }}
                className="w-full bg-slate-900 border border-polaris-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                {SUPPORTED_ASSETS.map((asset) => (
                  <option key={asset.code} value={asset.code}>
                    {asset.icon} {asset.name} ({asset.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300">Milestone Schedule</label>
              <button
                type="button"
                onClick={addMilestone}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Milestone
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {milestones.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-polaris-border">
                  <span className="text-xs font-mono text-slate-500 w-5">#{idx + 1}</span>
                  <input
                    type="text"
                    required
                    value={m.description}
                    onChange={(e) => updateMilestone(idx, "description", e.target.value)}
                    placeholder="Milestone description"
                    className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={m.amount}
                    onChange={(e) => updateMilestone(idx, "amount", e.target.value)}
                    className="w-24 bg-slate-800 border border-polaris-border rounded-lg px-2 py-1 text-xs text-white text-right focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">{selectedAsset.code}</span>
                  <button
                    type="button"
                    onClick={() => removeMilestone(idx)}
                    disabled={milestones.length <= 1}
                    className="text-slate-500 hover:text-rose-400 disabled:opacity-20 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Soroban RPC preflight simulation */}
          <TxSimulationPreview
            operation="create_escrow"
            depositAmount={totalAmount}
            assetCode={selectedAsset.code}
          />

          <div className="pt-4 border-t border-polaris-border flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Total Locked Escrow:</span>
              <div className="text-lg font-bold text-sky-400">
                {totalAmount.toLocaleString()} {selectedAsset.code}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-polaris-border text-slate-300 hover:bg-slate-800 text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || totalAmount <= 0}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 text-white font-medium text-xs transition disabled:opacity-50"
              >
                {isSubmitting ? "Locking Funds on Stellar..." : "Sign & Lock Funds"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { X, Upload, CheckCircle2, Hash, ExternalLink } from "lucide-react";
import { JobItem } from "./EscrowList";
import { TxSimulationPreview } from "./TxSimulationPreview";

interface SubmitMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  job: JobItem | null;
  milestoneId: number | null;
}

export function SubmitMilestoneModal({
  isOpen,
  onClose,
  onSuccess,
  job,
  milestoneId,
}: SubmitMilestoneModalProps) {
  const [deliveryUri, setDeliveryUri] = useState("https://github.com/stellar/soroban-example-dapp/pull/12");
  const [deliveryCid, setDeliveryCid] = useState("bafybeideliveryproofsorobansac2026hash32bytes");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !job || milestoneId === null) return null;

  const milestone = job.milestones.find((m) => m.id === milestoneId);

  const computeSha256 = async (input: string) => {
    if (!input) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    setDeliveryCid(`bafybeic${hex.slice(0, 48)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Simulate on-chain submit_delivery invocation
      await new Promise((resolve) => setTimeout(resolve, 800));
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1">Submit Deliverable & IPFS Proof</h3>
        <p className="text-xs text-slate-400 mb-4">
          Job #{job.job_id} · Milestone #{milestoneId}: {milestone?.description}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Deliverable URI / Git PR / Docs URL
            </label>
            <input
              type="text"
              required
              value={deliveryUri}
              onChange={(e) => {
                setDeliveryUri(e.target.value);
                computeSha256(e.target.value);
              }}
              placeholder="https://github.com/... or https://..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                IPFS Content Hash (Sha256 / BytesN&lt;32&gt;)
              </label>
              <button
                type="button"
                onClick={() => computeSha256(deliveryUri)}
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Hash className="w-3 h-3" /> Re-hash
              </button>
            </div>
            <input
              type="text"
              required
              value={deliveryCid}
              onChange={(e) => setDeliveryCid(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Submission Notes / Verification Log
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Smart contract compiled to Wasm with 100% test coverage and formal invariants."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <TxSimulationPreview operation="submit_delivery" />

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Committing to Ledger..." : "Commit Delivery On-Chain"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

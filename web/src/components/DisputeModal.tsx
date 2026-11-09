"use client";

import React, { useState } from "react";
import { X, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { EscrowItem } from "./EscrowList";
import { TxSimulationPreview } from "./TxSimulationPreview";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  escrow: EscrowItem | null;
}

export function DisputeModal({
  isOpen,
  onClose,
  onSuccess,
  escrow,
}: DisputeModalProps) {
  const [reason, setReason] = useState("milestone_quality_issue");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen || !escrow) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) return;
    setIsSubmitting(true);
    try {
      // In production Soroban flow, client invokes raise_dispute on polaris-escrow contract
      await new Promise((r) => setTimeout(r, 1200));
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
      <div className="bg-polaris-card border border-rose-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2 text-rose-400">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold text-white">Raise Protocol Dispute</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Escrow #{escrow.id}: {escrow.title}. Raising a dispute will pause automatic releases and invoke the designated arbiter.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-300 font-mono">
              <span>Remaining Locked:</span>
              <span className="font-bold text-white">
                {(escrow.remaining_balance / 10_000_000).toLocaleString()} USDC
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
              <span>Designated Arbiter:</span>
              <span>{escrow.arbiter.slice(0, 8)}...{escrow.arbiter.slice(-6)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Dispute Category
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-900 border border-polaris-border rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="milestone_quality_issue">Deliverable Not Matching Specifications</option>
              <option value="missed_deadline">Unresponsive Contractor / Missed Deadline</option>
              <option value="client_non_responsive">Client Unresponsive to Approval Requests</option>
              <option value="scope_alteration">Disagreement on Scope Alteration</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Detailed Statement for Arbiter
            </label>
            <textarea
              rows={3}
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain the specific issue, deliverable differences, and attempted resolution steps."
              className="w-full bg-slate-900 border border-polaris-border rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <TxSimulationPreview operation="raise_dispute" />

          <label className="flex items-start gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-rose-500"
            />
            <span className="text-[11px] text-slate-400 leading-tight">
              I understand that raising a dispute freezes funds in the Soroban escrow until the arbiter submits an on-chain resolution verdict.
            </span>
          </label>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-polaris-border text-slate-300 hover:bg-slate-800 text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !confirmed || !details.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? "Invoking Soroban Arbiter..." : "Confirm & Raise Dispute"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


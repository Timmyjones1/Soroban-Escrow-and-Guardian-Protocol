"use client";

import React, { useState } from "react";
import { X, ShieldAlert, Scale, CheckCircle2, AlertTriangle } from "lucide-react";
import { JobItem } from "./EscrowList";
import { TxSimulationPreview } from "./TxSimulationPreview";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  job: JobItem | null;
  milestoneId: number | null;
  mode: "raise" | "resolve";
}

export function DisputeModal({
  isOpen,
  onClose,
  onSuccess,
  job,
  milestoneId,
  mode,
}: DisputeModalProps) {
  const [reason, setReason] = useState("Deliverable fails to meet contract specification acceptance criteria.");
  const [clientPayout, setClientPayout] = useState("50");
  const [freelancerPayout, setFreelancerPayout] = useState("50");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !job || milestoneId === null) return null;

  const milestone = job.milestones.find((m) => m.id === milestoneId);
  const totalAmount = milestone ? milestone.amount / 10_000_000 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
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

        <div className="flex items-center gap-2 mb-2">
          {mode === "raise" ? (
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Scale className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-white">
              {mode === "raise" ? "Raise Contractual Dispute" : "Arbiter Dispute Resolution"}
            </h3>
            <p className="text-xs text-slate-400">
              Job #{job.job_id} · Milestone #{milestoneId}: {milestone?.description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm mt-4">
          {mode === "raise" ? (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reason for Dispute
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Freezes milestone in Disputed status until the designated arbiter examines on-chain proofs and renders a binding payout decision.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                <span className="text-slate-400 block">Total Disputed Value:</span>
                <span className="text-base font-bold text-white">{totalAmount.toLocaleString()} USDC</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Client Refund (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={clientPayout}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setClientPayout(String(val));
                      setFreelancerPayout(String(100 - val));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Freelancer Payout (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={freelancerPayout}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setFreelancerPayout(String(val));
                      setClientPayout(String(100 - val));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          <TxSimulationPreview operation={mode === "raise" ? "raise_dispute" : "resolve_dispute"} />

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
              className={`px-4 py-2 rounded-xl font-semibold text-xs shadow-lg transition text-white ${mode === "raise"
                  ? "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20"
                  : "bg-purple-600 hover:bg-purple-500 shadow-purple-500/20"
                }`}
            >
              {isSubmitting
                ? "Submitting Ruling..."
                : mode === "raise"
                  ? "Lock Milestone in Dispute"
                  : "Execute Binding Ruling"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { X, Upload, CheckCircle2 } from "lucide-react";
import { EscrowItem } from "./EscrowList";
import { TxSimulationPreview } from "./TxSimulationPreview";
import { STELLAR_CONFIG } from "@/config/stellar";

interface SubmitMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  escrow: EscrowItem | null;
  milestoneIndex: number | null;
}

export function SubmitMilestoneModal({
  isOpen,
  onClose,
  onSuccess,
  escrow,
  milestoneIndex,
}: SubmitMilestoneModalProps) {
  const [proofHash, setProofHash] = useState("ipfs://bafybeideliveryproof2026");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !escrow || milestoneIndex === null) return null;

  const milestone = escrow.milestones[milestoneIndex];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch(
        `${STELLAR_CONFIG.backendUrl}/api/v1/escrows/${escrow.id}/milestones/${milestoneIndex}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "submitted",
            proof_hash: proofHash,
          }),
        }
      );
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
      <div className="bg-polaris-card border border-polaris-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold mb-1">Submit Deliverable Proof</h3>
        <p className="text-xs text-slate-400 mb-4">
          Milestone #{milestoneIndex + 1}: {milestone?.description}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Proof Hash / IPFS URI
            </label>
            <input
              type="text"
              required
              value={proofHash}
              onChange={(e) => setProofHash(e.target.value)}
              placeholder="ipfs://bafy... or SHA256"
              className="w-full bg-slate-900 border border-polaris-border rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Changelog</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Completed smart contract implementation with 100% test coverage."
              className="w-full bg-slate-900 border border-polaris-border rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <TxSimulationPreview operation="submit_milestone" />

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
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs transition disabled:opacity-50"
            >
              {isSubmitting ? "Submitting to Stellar..." : "Submit to Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


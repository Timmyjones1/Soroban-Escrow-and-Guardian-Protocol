"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, ArrowUpRight, ShieldAlert, FileText } from "lucide-react";

export interface EscrowItem {
  id: number;
  title: string;
  client: string;
  contractor: string;
  arbiter: string;
  total_amount: number;
  remaining_balance: number;
  released_amount: number;
  status: "active" | "completed" | "disputed" | "refunded";
  milestones: Array<{
    index: number;
    description: string;
    amount: number;
    deadline: number;
    status: "pending" | "submitted" | "approved" | "refunded";
    proof_hash?: string;
  }>;
}

interface EscrowListProps {
  escrows: EscrowItem[];
  userAddress: string | null;
  onSubmitMilestone: (escrow: EscrowItem, milestoneIndex: number) => void;
  onApproveMilestone: (escrow: EscrowItem, milestoneIndex: number) => void;
  onRaiseDispute: (escrow: EscrowItem) => void;
  onOpenAnchor: (escrow: EscrowItem) => void;
}

export function EscrowList({
  escrows,
  userAddress,
  onSubmitMilestone,
  onApproveMilestone,
  onRaiseDispute,
  onOpenAnchor,
}: EscrowListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(escrows[0]?.id || null);

  const formatAmount = (stroops: number) => (stroops / 10_000_000).toLocaleString();
  const truncate = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (escrows.length === 0) {
    return (
      <div className="bg-polaris-card border border-polaris-border rounded-2xl p-12 text-center">
        <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-300">No Escrows Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          Create an escrow above or connect your Freighter wallet to query active contracts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {escrows.map((escrow) => {
        const percentReleased = Math.round(
          (escrow.released_amount / escrow.total_amount) * 100
        ) || 0;
        const isExpanded = expandedId === escrow.id;

        return (
          <div
            key={escrow.id}
            className="bg-polaris-card border border-polaris-border rounded-2xl overflow-hidden transition shadow-lg hover:border-slate-700"
          >
            {/* Header / Summary */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : escrow.id)}
              className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    #{escrow.id}
                  </span>
                  <h3 className="font-semibold text-base text-white hover:text-sky-400 transition">
                    {escrow.title}
                  </h3>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      escrow.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : escrow.status === "disputed"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                    }`}
                  >
                    {escrow.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                  <span>Client: {truncate(escrow.client)}</span>
                  <span>•</span>
                  <span>Contractor: {truncate(escrow.contractor)}</span>
                </div>
              </div>

              {/* Progress & Amount */}
              <div className="flex items-center gap-6">
                <div className="w-32">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 font-mono">{percentReleased}% Paid</span>
                    <span className="text-slate-500 font-mono">
                      {escrow.milestones.filter((m) => m.status === "approved").length}/
                      {escrow.milestones.length}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full transition-all duration-500"
                      style={{ width: `${percentReleased}%` }}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-white font-mono">
                    {formatAmount(escrow.total_amount)} USDC
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {formatAmount(escrow.remaining_balance)} locked
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable Milestones Accordion */}
            {isExpanded && (
              <div className="border-t border-polaris-border bg-slate-950/40 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Contract Milestones
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenAnchor(escrow)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg flex items-center gap-1 transition"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>SEP Anchor Cashout</span>
                    </button>
                    {escrow.status === "active" && (
                      <button
                        onClick={() => onRaiseDispute(escrow)}
                        className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-lg flex items-center gap-1 transition"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Dispute</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {escrow.milestones.map((milestone) => (
                    <div
                      key={milestone.index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {milestone.status === "approved" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : milestone.status === "submitted" ? (
                          <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                        )}
                        <div>
                          <div className="font-medium text-white">{milestone.description}</div>
                          {milestone.proof_hash && (
                            <div className="text-[11px] text-sky-400 font-mono mt-0.5 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>Proof: {milestone.proof_hash}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span className="font-bold text-white font-mono">
                          {formatAmount(milestone.amount)} USDC
                        </span>

                        <div className="flex items-center gap-2">
                          {milestone.status === "pending" && (
                            <button
                              onClick={() => onSubmitMilestone(escrow, milestone.index)}
                              className="px-3 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition font-medium"
                            >
                              Submit Deliverable
                            </button>
                          )}

                          {milestone.status === "submitted" && (
                            <button
                              onClick={() => onApproveMilestone(escrow, milestone.index)}
                              className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition font-medium"
                            >
                              Approve & Release
                            </button>
                          )}

                          {milestone.status === "approved" && (
                            <span className="text-[11px] text-emerald-400 font-mono font-medium">
                              Paid On-Chain
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

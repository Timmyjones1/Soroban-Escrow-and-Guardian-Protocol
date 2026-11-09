"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  FileText,
  ExternalLink,
  Zap,
  Percent,
  Check,
  RefreshCw,
} from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import { STELLAR_CONFIG } from "@/config/stellar";

export interface PayeeSplitItem {
  payee: string;
  bps: number;
}

export interface MilestoneItem {
  id: number;
  description: string;
  amount: number; // in stroops or tokens
  deliver_by: number; // unix timestamp
  review_window: number; // seconds
  delivered_at: number; // unix timestamp
  delivery_cid?: string;
  delivery_uri?: string;
  status: "Funded" | "Delivered" | "Disputed" | "Resolved" | "Completed" | "Refunded";
}

export interface JobItem {
  job_id: number;
  title: string;
  client: string;
  freelancer: string;
  arbiter?: string | null;
  token: string;
  total_amount: number;
  current_milestone: number;
  milestones: MilestoneItem[];
  splits: PayeeSplitItem[];
}

export type EscrowItem = JobItem;

interface EscrowListProps {
  jobs: JobItem[];
  userAddress: string | null;
  activeRole: "all" | "client" | "freelancer" | "arbiter";
  onSubmitDelivery: (job: JobItem, milestoneId: number) => void;
  onApproveMilestone: (job: JobItem, milestoneId: number) => void;
  onClaimReviewTimeout: (job: JobItem, milestoneId: number) => void;
  onRefundMissedDeadline: (job: JobItem, milestoneId: number) => void;
  onRaiseDispute: (job: JobItem, milestoneId: number) => void;
  onResolveDispute: (job: JobItem, milestoneId: number) => void;
}

export function EscrowList({
  jobs,
  userAddress,
  activeRole,
  onSubmitDelivery,
  onApproveMilestone,
  onClaimReviewTimeout,
  onRefundMissedDeadline,
  onRaiseDispute,
  onResolveDispute,
}: EscrowListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(jobs[0]?.job_id || null);

  const formatAmount = (stroops: number) => (stroops / 10_000_000).toLocaleString();
  const truncate = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (jobs.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
        <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-300">No Polaris Escrows Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          {activeRole !== "all"
            ? `No active escrows where your connected address acts ${activeRole}.`
            : "Initialize an escrow job above or switch your wallet filter."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => {
        const isExpanded = expandedId === job.job_id;
        const completedMilestones = job.milestones.filter((m) => m.status === "Completed").length;
        const totalMilestones = job.milestones.length;
        const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

        return (
          <div
            key={job.job_id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition shadow-xl hover:border-slate-700"
          >
            {/* Summary Header */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : job.job_id)}
              className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono bg-slate-800 text-cyan-400 border border-slate-700 px-2 py-0.5 rounded">
                    Job #{job.job_id}
                  </span>
                  <h3 className="font-semibold text-base text-white hover:text-cyan-400 transition">
                    {job.title}
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {progressPercent === 100 ? "Completed" : `${progressPercent}% Progress`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                  <span>
                    Client:{" "}
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${job.client}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-300 hover:text-cyan-400 hover:underline"
                    >
                      {truncate(job.client)}
                    </a>
                  </span>
                  <span>·</span>
                  <span>
                    Freelancer:{" "}
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${job.freelancer}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-300 hover:text-cyan-400 hover:underline"
                    >
                      {truncate(job.freelancer)}
                    </a>
                  </span>
                  {job.arbiter && (
                    <>
                      <span>·</span>
                      <span>
                        Arbiter:{" "}
                        <a
                          href={`https://stellar.expert/explorer/testnet/account/${job.arbiter}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-300 hover:text-purple-400 hover:underline"
                        >
                          {truncate(job.arbiter)}
                        </a>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Amount & Progress */}
              <div className="flex items-center gap-6 self-start md:self-center">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Escrow Value</span>
                  <span className="text-base font-bold text-white">
                    {formatAmount(job.total_amount)} USDC
                  </span>
                </div>

                <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden hidden sm:block">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Expanded Milestones & Payee Splits */}
            {isExpanded && (
              <div className="border-t border-slate-800 bg-slate-950/60 p-5 space-y-5">
                {/* Payee Splits Banner */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-emerald-400" />
                    Payee Splits:
                  </span>
                  {job.splits.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700"
                    >
                      {truncate(s.payee)} ({(s.bps / 100).toFixed(1)}%)
                    </span>
                  ))}
                  <a
                    href={`https://stellar.expert/explorer/testnet/contract/${STELLAR_CONFIG.contractId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    SAC Escrow Contract <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Milestones Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Milestone Schedule & Timelocks
                  </h4>

                  {job.milestones.map((m) => {
                    const now = Math.floor(Date.now() / 1000);
                    const isDeliveryDeadlinePassed = now > m.deliver_by;
                    const reviewDeadline = m.delivered_at + m.review_window;
                    const isReviewWindowPassed = m.status === "Delivered" && now >= reviewDeadline;

                    return (
                      <div
                        key={m.id}
                        className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-300">
                              #{m.id} {m.description}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                m.status === "Completed"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : m.status === "Delivered"
                                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                  : m.status === "Disputed"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : m.status === "Refunded"
                                  ? "bg-slate-700 text-slate-400 border border-slate-600"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {m.status}
                            </span>
                          </div>

                          {/* Countdown Timers */}
                          <div className="flex flex-wrap items-center gap-3">
                            {m.status === "Funded" && (
                              <CountdownTimer
                                targetTimestamp={m.deliver_by}
                                label="Deliver By"
                                expiredLabel="Deadline Missed (Refund Available)"
                              />
                            )}

                            {m.status === "Delivered" && (
                              <CountdownTimer
                                targetTimestamp={reviewDeadline}
                                label="Client Review Window"
                                expiredLabel="Review Window Elapsed (Keeper Claimable)"
                              />
                            )}

                            {m.delivery_cid && (
                              <div className="text-[11px] font-mono text-purple-400 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                <span>Proof CID: {m.delivery_cid.slice(0, 16)}...</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions for this Milestone */}
                        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                          <span className="font-bold text-sm text-white mr-2">
                            {formatAmount(m.amount)} USDC
                          </span>

                          {/* Freelancer Action: Submit Delivery */}
                          {m.status === "Funded" && !isDeliveryDeadlinePassed && (
                            <button
                              onClick={() => onSubmitDelivery(job, m.id)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition"
                            >
                              Submit Delivery
                            </button>
                          )}

                          {/* Client Action: Approve Delivery */}
                          {m.status === "Delivered" && (
                            <button
                              onClick={() => onApproveMilestone(job, m.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Payout
                            </button>
                          )}

                          {/* Review Timeout Action (Freelancer or Keeper) */}
                          {m.status === "Delivered" && isReviewWindowPassed && (
                            <button
                              onClick={() => onClaimReviewTimeout(job, m.id)}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition flex items-center gap-1 animate-pulse"
                              title="Client failed to review in time. Auto-claim payout with keeper micro-bounty."
                            >
                              <Zap className="w-3.5 h-3.5 text-amber-200" /> Claim Timeout
                            </button>
                          )}

                          {/* Missed Deadline Refund Action */}
                          {m.status === "Funded" && isDeliveryDeadlinePassed && (
                            <button
                              onClick={() => onRefundMissedDeadline(job, m.id)}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition"
                            >
                              Claim Missed Refund
                            </button>
                          )}

                          {/* Dispute Actions */}
                          {m.status === "Delivered" && (
                            <button
                              onClick={() => onRaiseDispute(job, m.id)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs font-semibold transition"
                            >
                              Dispute
                            </button>
                          )}

                          {m.status === "Disputed" && (
                            <button
                              onClick={() => onResolveDispute(job, m.id)}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition"
                            >
                              Arbiter Ruling
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

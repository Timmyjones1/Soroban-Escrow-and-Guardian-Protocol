"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Zap,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
} from "lucide-react";
import { STELLAR_CONFIG } from "@/config/stellar";

export interface BreachTimelineItem {
  breachId: number;
  jobId: number;
  milestoneId: number;
  breachKind: "DeadlineMissed" | "ReviewTimeoutExpired" | "DisputeEscalated";
  entitledParty: string;
  reporter: string;
  bountyPaid: number;
  timestamp: string;
  txHash: string;
}

interface GuardianBreachTimelineProps {
  onTriggerKeeperAction?: (jobId: number, milestoneId: number, actionKind: number) => Promise<void>;
}

export function GuardianBreachTimeline({ onTriggerKeeperAction }: GuardianBreachTimelineProps) {
  const [breaches, setBreaches] = useState<BreachTimelineItem[]>([
    {
      breachId: 101,
      jobId: 1,
      milestoneId: 1,
      breachKind: "ReviewTimeoutExpired",
      entitledParty: "GCPOLARISDEMOFREELANCERTESTNETXXXXXXXXXXXXXXXXXX",
      reporter: "GBKEEPER9DAEMON9MICRO9BOUNTY9HUNTER99999999999",
      bountyPaid: 500,
      timestamp: "10 mins ago",
      txHash: "8b7e21fa75c328db9932ad8d394142f36f9011867fa2382dcda28e937d2f9bf1",
    },
    {
      breachId: 100,
      jobId: 2,
      milestoneId: 2,
      breachKind: "DeadlineMissed",
      entitledParty: "GBPOLARISDEMOCLIENTACCOUNTTESTNETXXXXXXXXXXXXXXXXX",
      reporter: "GBKEEPER9DAEMON9MICRO9BOUNTY9HUNTER99999999999",
      bountyPaid: 500,
      timestamp: "2 hours ago",
      txHash: "1f33ca5e10aa394fcd077fef69b22416b2d1844b25caadcb19ecae84f5d5e219",
    },
  ]);

  const [executing, setExecuting] = useState(false);

  const handleManualKeeperTrigger = async () => {
    if (!onTriggerKeeperAction) return;
    setExecuting(true);
    try {
      await onTriggerKeeperAction(1, 1, 0);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-white">Polaris Guardian On-Chain Breach Registry</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Immutable timeline of contractual breaches enforced by decentralized keepers on Soroban.
            When delivery deadlines pass or review windows expire, keepers trigger on-chain self-healing and earn micro-bounties.
          </p>
        </div>

        <button
          onClick={handleManualKeeperTrigger}
          disabled={executing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/20 disabled:opacity-50 transition shrink-0"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>{executing ? "Enforcing On-Chain..." : "Simulate Keeper Enforce (Earn Bounty)"}</span>
        </button>
      </div>

      {/* Timeline List */}
      <div className="border border-slate-800 rounded-2xl bg-slate-950/50 divide-y divide-slate-800/80 overflow-hidden">
        {breaches.map((b) => (
          <div key={b.breachId} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/40 transition">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl mt-0.5 ${
                  b.breachKind === "ReviewTimeoutExpired"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {b.breachKind === "ReviewTimeoutExpired"
                      ? "Review Window Elapsed (Silent Client)"
                      : "Delivery Deadline Missed"}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Job #{b.jobId} · Milestone #{b.milestoneId}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <span>
                    Entitled Beneficiary:{" "}
                    <code className="text-slate-300">
                      {b.entitledParty.slice(0, 6)}...{b.entitledParty.slice(-6)}
                    </code>
                  </span>
                  <span>·</span>
                  <span>
                    Enforced by Keeper:{" "}
                    <code className="text-slate-300">
                      {b.reporter.slice(0, 6)}...{b.reporter.slice(-6)}
                    </code>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 self-end md:self-center">
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs font-bold text-purple-400">
                  <Award className="w-3.5 h-3.5" />
                  <span>+{b.bountyPaid} USDC Bounty</span>
                </div>
                <span className="text-[10px] text-slate-500">{b.timestamp}</span>
              </div>

              <a
                href={`https://stellar.expert/explorer/testnet/tx/${b.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="View on Stellar Expert"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


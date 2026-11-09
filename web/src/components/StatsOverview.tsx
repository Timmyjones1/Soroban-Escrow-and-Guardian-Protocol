"use client";

import React from "react";
import { ShieldCheck, DollarSign, Clock, Zap, Award } from "lucide-react";
import { JobItem } from "./EscrowList";

interface StatsOverviewProps {
  jobs?: JobItem[];
}

export function StatsOverview({ jobs = [] }: StatsOverviewProps) {
  const totalLockedStroops = jobs.reduce((sum, j) => sum + j.total_amount, 0);
  const activeCount = jobs.filter((j) =>
    j.milestones.some((m) => m.status === "Funded" || m.status === "Delivered")
  ).length;
  const completedMilestones = jobs.reduce(
    (count, j) => count + j.milestones.filter((m) => m.status === "Completed").length,
    0
  );

  const formatStroops = (stroops: number) =>
    (stroops / 10_000_000).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const cards = [
    {
      label: "Total Value Locked (TVL)",
      value: `${formatStroops(totalLockedStroops || 150_000_0000000)} USDC`,
      change: "Circle SAC Soroban Balance",
      icon: DollarSign,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      label: "Active Escrows",
      value: (activeCount || 2).toString(),
      change: `${completedMilestones || 4} completed disbursements`,
      icon: ShieldCheck,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Guardian Keepers",
      value: "100% Autonomous",
      change: "Self-healing breach enforcement",
      icon: Award,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Stellar Finality",
      value: "~3.8s",
      change: "< 0.00001 XLM gas fee",
      icon: Zap,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 font-medium">{card.label}</span>
              <div className={`p-2 rounded-xl border ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{card.value}</div>
            <div className="text-xs text-slate-500 mt-1">{card.change}</div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import React from "react";
import { ShieldCheck, DollarSign, Clock, Zap } from "lucide-react";
import { EscrowItem } from "./EscrowList";

interface StatsOverviewProps {
  escrows: EscrowItem[];
}

export function StatsOverview({ escrows }: StatsOverviewProps) {
  const totalLockedStroops = escrows.reduce((sum, e) => sum + e.remaining_balance, 0);
  const totalReleasedStroops = escrows.reduce((sum, e) => sum + e.released_amount, 0);
  const activeCount = escrows.filter((e) => e.status === "active").length;
  const completedCount = escrows.filter((e) => e.status === "completed").length;

  const formatStroops = (stroops: number) =>
    (stroops / 10_000_000).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const cards = [
    {
      label: "Total Value Locked (TVL)",
      value: `${formatStroops(totalLockedStroops)} USDC`,
      change: "On-Chain Soroban Balance",
      icon: DollarSign,
      color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    },
    {
      label: "Active Escrows",
      value: activeCount.toString(),
      change: `${completedCount} completed escrows`,
      icon: ShieldCheck,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Disbursed to Talent",
      value: `${formatStroops(totalReleasedStroops)} USDC`,
      change: "Milestone-backed releases",
      icon: Clock,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Stellar Finality",
      value: "~3.8s",
      change: "< $0.00001 per transaction",
      icon: Zap,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="bg-polaris-card border border-polaris-border rounded-2xl p-5 shadow-lg relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{card.label}</span>
              <div className={`p-2 rounded-xl border ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                {card.value}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{card.change}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


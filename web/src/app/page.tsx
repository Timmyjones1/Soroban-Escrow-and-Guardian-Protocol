"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Shield, Zap, Sparkles, AlertCircle } from "lucide-react";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { EscrowList, EscrowItem } from "@/components/EscrowList";
import { CreateEscrowModal } from "@/components/CreateEscrowModal";
import { SubmitMilestoneModal } from "@/components/SubmitMilestoneModal";
import { DisputeModal } from "@/components/DisputeModal";
import { AnchorModal } from "@/components/AnchorModal";
import { StatsOverview } from "@/components/StatsOverview";
import { STELLAR_CONFIG } from "@/config/stellar";

const INITIAL_ESCROWS: EscrowItem[] = [
  {
    id: 1,
    title: "Soroban Smart Contract & Cross-Border Anchor Integration",
    client: "GBCLIENT7XJ3N2QY4KLM6WPR9TS8VBC1Z0DFE2GHI3JKLM4NOP5QRST6U",
    contractor: "GDDEV8YQ9B2LM4NOP5QRST6UVWXY0Z1ABC2DEF3GHI4JKLM5NOP6QRS7T",
    arbiter: "GBARBITER3KLM4NOP5QRST6UVWXY0Z1ABC2DEF3GHI4JKLM5NOP6QRST9U",
    total_amount: 25_000_0000000,
    remaining_balance: 15_000_0000000,
    released_amount: 10_000_0000000,
    status: "active",
    milestones: [
      {
        index: 0,
        description: "Milestone 1: Smart contract architecture & Soroban SDK implementation",
        amount: 10_000_0000000,
        deadline: 1735689600,
        status: "approved",
        proof_hash: "ipfs://bafybeicontractwasmbuild2026",
      },
      {
        index: 1,
        description: "Milestone 2: Testnet deployment, mock USDC SAC, and property fuzzing",
        amount: 7_500_0000000,
        deadline: 1738368000,
        status: "submitted",
        proof_hash: "ipfs://bafybeitestnetdeploymenthash2026",
      },
      {
        index: 2,
        description: "Milestone 3: Thin client frontend & SEP-24 fiat off-ramp integration",
        amount: 7_500_0000000,
        deadline: 1740787200,
        status: "pending",
      },
    ],
  },
  {
    id: 2,
    title: "Mobile Freelancer App UI Redesign & SEP-10 Auth",
    client: "GACLIENT1111111111111111111111111111111111111111111111111111",
    contractor: "GDDEV22222222222222222222222222222222222222222222222222222222",
    arbiter: "GBARBITER3KLM4NOP5QRST6UVWXY0Z1ABC2DEF3GHI4JKLM5NOP6QRST9U",
    total_amount: 12_000_0000000,
    remaining_balance: 0,
    released_amount: 12_000_0000000,
    status: "completed",
    milestones: [
      {
        index: 0,
        description: "Milestone 1: Design system, typography, and wireframes",
        amount: 6_000_0000000,
        deadline: 1731689600,
        status: "approved",
        proof_hash: "ipfs://bafybeifigmadesignbundle2026",
      },
      {
        index: 1,
        description: "Milestone 2: Frontend prototype with Freighter wallet connection",
        amount: 6_000_0000000,
        deadline: 1732689600,
        status: "approved",
        proof_hash: "ipfs://bafybeinextjsappproductionbuild",
      },
    ],
  },
];

export default function DashboardPage() {
  const { address, isConnected, connect, isConnecting } = useStellarWallet();
  const [escrows, setEscrows] = useState<EscrowItem[]>(INITIAL_ESCROWS);
  const [filterTab, setFilterTab] = useState<"all" | "active" | "completed" | "disputed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowItem | null>(null);
  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState<number | null>(null);
  const [isSubmitMilestoneOpen, setIsSubmitMilestoneOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isAnchorOpen, setIsAnchorOpen] = useState(false);

  // Attempt to fetch live from backend store if running
  useEffect(() => {
    const fetchBackendEscrows = async () => {
      try {
        const res = await fetch(`${STELLAR_CONFIG.backendUrl}/api/v1/escrows`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setEscrows(json.data);
          }
        }
      } catch {
        // Fallback to initial mock data if backend server is not running locally
      }
    };
    fetchBackendEscrows();
  }, []);

  const filteredEscrows = escrows.filter((escrow) => {
    const matchesTab = filterTab === "all" || escrow.status === filterTab;
    const matchesSearch =
      escrow.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      escrow.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      escrow.contractor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleApproveMilestone = (escrow: EscrowItem, index: number) => {
    setEscrows((prev) =>
      prev.map((e) => {
        if (e.id !== escrow.id) return e;
        const targetMilestone = e.milestones[index];
        if (!targetMilestone || targetMilestone.status === "approved") return e;

        const updatedMilestones = e.milestones.map((m, i) =>
          i === index ? { ...m, status: "approved" as const } : m
        );
        const newReleased = e.released_amount + targetMilestone.amount;
        const newRemaining = Math.max(0, e.remaining_balance - targetMilestone.amount);
        const allApproved = updatedMilestones.every((m) => m.status === "approved");

        return {
          ...e,
          milestones: updatedMilestones,
          released_amount: newReleased,
          remaining_balance: newRemaining,
          status: allApproved ? ("completed" as const) : e.status,
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-sky-900/40 via-indigo-900/20 to-slate-900/60 border border-sky-500/20 p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built Natively on Stellar Testnet & Soroban SDK</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Trustless Milestone Escrows & Global Talent Payroll
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Lock funds securely in Soroban smart contracts, release payments conditionally upon
            cryptographic proof of delivery, and off-ramp directly to 40+ fiat currencies via
            regulated Stellar Anchors (SEP-24 / SEP-6).
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-sky-500/25 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Escrow</span>
            </button>

            {!isConnected && (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-medium transition"
              >
                {isConnecting ? "Connecting..." : "Connect Freighter Wallet"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Protocol Metrics */}
      <StatsOverview escrows={escrows} />

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-polaris-border rounded-xl">
          {(["all", "active", "completed", "disputed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                filterTab === tab
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title or Stellar address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-polaris-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Escrow List */}
      <EscrowList
        escrows={filteredEscrows}
        userAddress={address}
        onSubmitMilestone={(escrow, idx) => {
          setSelectedEscrow(escrow);
          setSelectedMilestoneIndex(idx);
          setIsSubmitMilestoneOpen(true);
        }}
        onApproveMilestone={handleApproveMilestone}
        onRaiseDispute={(escrow) => {
          setSelectedEscrow(escrow);
          setIsDisputeOpen(true);
        }}
        onOpenAnchor={(escrow) => {
          setSelectedEscrow(escrow);
          setIsAnchorOpen(true);
        }}
      />

      {/* Modals */}
      <CreateEscrowModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
        }}
        clientAddress={address}
      />

      <SubmitMilestoneModal
        isOpen={isSubmitMilestoneOpen}
        onClose={() => setIsSubmitMilestoneOpen(false)}
        onSuccess={() => {
          if (selectedEscrow && selectedMilestoneIndex !== null) {
            setEscrows((prev) =>
              prev.map((e) => {
                if (e.id !== selectedEscrow.id) return e;
                const updated = e.milestones.map((m, i) =>
                  i === selectedMilestoneIndex
                    ? { ...m, status: "submitted" as const, proof_hash: "ipfs://bafybeideliveryproof2026" }
                    : m
                );
                return { ...e, milestones: updated };
              })
            );
          }
        }}
        escrow={selectedEscrow}
        milestoneIndex={selectedMilestoneIndex}
      />

      <DisputeModal
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        onSuccess={() => {
          if (selectedEscrow) {
            setEscrows((prev) =>
              prev.map((e) => (e.id === selectedEscrow.id ? { ...e, status: "disputed" } : e))
            );
          }
        }}
        escrow={selectedEscrow}
      />

      <AnchorModal
        isOpen={isAnchorOpen}
        onClose={() => setIsAnchorOpen(false)}
        escrow={selectedEscrow}
      />
    </div>
  );
}


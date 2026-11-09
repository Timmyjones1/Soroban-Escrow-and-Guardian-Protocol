"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Shield,
  Zap,
  Sparkles,
  AlertCircle,
  Briefcase,
  Wrench,
  Scale,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { EscrowList, JobItem } from "@/components/EscrowList";
import { CreateJobWizard } from "@/components/CreateJobWizard";
import { SubmitMilestoneModal } from "@/components/SubmitMilestoneModal";
import { DisputeModal } from "@/components/DisputeModal";
import { GuardianBreachTimeline } from "@/components/GuardianBreachTimeline";
import { StatsOverview } from "@/components/StatsOverview";
import { STELLAR_CONFIG } from "@/config/stellar";

const INITIAL_JOBS: JobItem[] = [
  {
    job_id: 1,
    title: "Soroban Smart Contract Core Architecture & SAC Settlement",
    client: "GBPOLARISDEMOCLIENTACCOUNTTESTNETXXXXXXXXXXXXXXXXX",
    freelancer: "GCPOLARISDEMOFREELANCERTESTNETXXXXXXXXXXXXXXXXXX",
    arbiter: "GAARBITER3STELLAR3SOROBAN3DAO3GOVERNANCE3TESTNET",
    token: STELLAR_CONFIG.usdcContractId,
    total_amount: 10_000_0000000,
    current_milestone: 0,
    splits: [
      { payee: "GCPOLARISDEMOFREELANCERTESTNETXXXXXXXXXXXXXXXXXX", bps: 8000 },
      { payee: "GDAGENCY2STELLAR2PARTNERSHIP2REVENUE2SPLIT", bps: 1500 },
      { payee: "GCPLATFORM2TREASURY2POLARIS2PROTOCOL2FEE", bps: 500 },
    ],
    milestones: [
      {
        id: 1,
        description: "Milestone 1: Rust Soroban SDK contracts with storage TTL & multi-payee splits",
        amount: 6_000_0000000,
        deliver_by: Math.floor(Date.now() / 1000) + 86400 * 5,
        review_window: 14400,
        delivered_at: Math.floor(Date.now() / 1000) - 1000,
        delivery_cid: "bafybeicontractwasmbuild2026productionreleasehash",
        delivery_uri: "https://github.com/stellar/soroban-example-dapp",
        status: "Delivered",
      },
      {
        id: 2,
        description: "Milestone 2: Automated Guardian keeper daemon & comprehensive property test suite",
        amount: 4_000_0000000,
        deliver_by: Math.floor(Date.now() / 1000) + 86400 * 14,
        review_window: 14400,
        delivered_at: 0,
        status: "Funded",
      },
    ],
  },
  {
    job_id: 2,
    title: "Mobile Freelancer App UI Redesign & Passkey Smart Wallet Kit",
    client: "GBPOLARISDEMOCLIENTACCOUNTTESTNETXXXXXXXXXXXXXXXXX",
    freelancer: "GCPOLARISDEMOFREELANCERTESTNETXXXXXXXXXXXXXXXXXX",
    arbiter: "GAARBITER3STELLAR3SOROBAN3DAO3GOVERNANCE3TESTNET",
    token: STELLAR_CONFIG.usdcContractId,
    total_amount: 5_000_0000000,
    current_milestone: 1,
    splits: [
      { payee: "GCPOLARISDEMOFREELANCERTESTNETXXXXXXXXXXXXXXXXXX", bps: 10000 },
    ],
    milestones: [
      {
        id: 1,
        description: "Milestone 1: WebAuthn Passkey biometric authentication and layout",
        amount: 5_000_0000000,
        deliver_by: Math.floor(Date.now() / 1000) - 5000,
        review_window: 7200,
        delivered_at: 0,
        status: "Completed",
      },
    ],
  },
];

type RoleTabType = "all" | "client" | "freelancer" | "arbiter" | "guardian";

export default function DashboardPage() {
  const { address, isConnected, connectWallet, isConnecting } = useStellarWallet();
  const [jobs, setJobs] = useState<JobItem[]>(INITIAL_JOBS);
  const [activeTab, setActiveTab] = useState<RoleTabType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeMode, setDisputeMode] = useState<"raise" | "resolve">("raise");

  // Filter jobs based on active role tab and search query
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.freelancer.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "all" || activeTab === "guardian") return true;
    if (activeTab === "client") {
      return !address || job.client.toLowerCase() === address.toLowerCase();
    }
    if (activeTab === "freelancer") {
      return !address || job.freelancer.toLowerCase() === address.toLowerCase();
    }
    if (activeTab === "arbiter") {
      return !address || (job.arbiter && job.arbiter.toLowerCase() === address.toLowerCase());
    }
    return true;
  });

  const handleCreateJob = async (jobData: any) => {
    const newJob: JobItem = {
      job_id: jobs.length + 1,
      title: jobData.title,
      client: address || jobData.client || "GBPOLARISDEMOCLIENTACCOUNTTESTNETXXXXXXXXXXXXXXXXX",
      freelancer: jobData.freelancer,
      arbiter: jobData.arbiter,
      token: jobData.token,
      total_amount: Math.floor(jobData.totalAmount * 10_000_000),
      current_milestone: 0,
      splits: jobData.splits.map((s: any) => ({ payee: s.payee, bps: s.bps })),
      milestones: jobData.milestones.map((m: any) => ({
        id: m.id,
        description: m.description,
        amount: Number(m.amount),
        deliver_by: m.deliver_by,
        review_window: m.review_window,
        delivered_at: 0,
        status: "Funded",
      })),
    };
    setJobs([newJob, ...jobs]);
  };

  const handleApproveMilestone = (job: JobItem, milestoneId: number) => {
    setJobs(
      jobs.map((j) => {
        if (j.job_id !== job.job_id) return j;
        return {
          ...j,
          milestones: j.milestones.map((m) =>
            m.id === milestoneId ? { ...m, status: "Completed" as const } : m
          ),
        };
      })
    );
  };

  const handleClaimReviewTimeout = (job: JobItem, milestoneId: number) => {
    setJobs(
      jobs.map((j) => {
        if (j.job_id !== job.job_id) return j;
        return {
          ...j,
          milestones: j.milestones.map((m) =>
            m.id === milestoneId ? { ...m, status: "Completed" as const } : m
          ),
        };
      })
    );
  };

  const handleRefundMissedDeadline = (job: JobItem, milestoneId: number) => {
    setJobs(
      jobs.map((j) => {
        if (j.job_id !== job.job_id) return j;
        return {
          ...j,
          milestones: j.milestones.map((m) =>
            m.id === milestoneId ? { ...m, status: "Refunded" as const } : m
          ),
        };
      })
    );
  };

  return (
    <div className="space-y-8">
      {/* Hero Protocol Banner */}
      <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Stellar-Native Soroban Protocol & Guardian Registry</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Polaris Escrow & Guardian Protocol
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              High-assurance, milestone-based escrow contracts featuring automated breach enforcement,
              dynamic multi-payee splits, native Circle USDC integration, and decentralized keeper micro-bounties.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsWizardOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-5 py-3 rounded-2xl text-sm shadow-xl shadow-cyan-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Escrow Job</span>
            </button>

            <a
              href={`https://stellar.expert/explorer/testnet/contract/${STELLAR_CONFIG.contractId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-sm font-semibold transition"
            >
              <span>Stellar Expert</span>
              <ExternalLink className="w-4 h-4 text-cyan-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Protocol Metrics */}
      <StatsOverview jobs={jobs} />

      {/* Role-Based Tabs & Search Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Role Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span>🌐 All Escrows</span>
            </button>

            <button
              onClick={() => setActiveTab("client")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "client"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>As Client</span>
            </button>

            <button
              onClick={() => setActiveTab("freelancer")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "freelancer"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>As Freelancer</span>
            </button>

            <button
              onClick={() => setActiveTab("arbiter")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "arbiter"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>As Arbitrator</span>
            </button>

            <button
              onClick={() => setActiveTab("guardian")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "guardian"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              <span>Guardian & Keepers</span>
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== "guardian" && (
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}
        </div>

        {/* Tab View Content */}
        {activeTab === "guardian" ? (
          <GuardianBreachTimeline
            onTriggerKeeperAction={async (jobId, milestoneId, actionKind) => {
              if (actionKind === 0) {
                handleClaimReviewTimeout(jobs[0], milestoneId);
              } else {
                handleRefundMissedDeadline(jobs[0], milestoneId);
              }
            }}
          />
        ) : (
          <EscrowList
            jobs={filteredJobs}
            userAddress={address}
            activeRole={activeTab}
            onSubmitDelivery={(job, milestoneId) => {
              setSelectedJob(job);
              setSelectedMilestoneId(milestoneId);
              setIsSubmitOpen(true);
            }}
            onApproveMilestone={(job, milestoneId) => {
              handleApproveMilestone(job, milestoneId);
            }}
            onClaimReviewTimeout={(job, milestoneId) => {
              handleClaimReviewTimeout(job, milestoneId);
            }}
            onRefundMissedDeadline={(job, milestoneId) => {
              handleRefundMissedDeadline(job, milestoneId);
            }}
            onRaiseDispute={(job, milestoneId) => {
              setSelectedJob(job);
              setSelectedMilestoneId(milestoneId);
              setDisputeMode("raise");
              setIsDisputeOpen(true);
            }}
            onResolveDispute={(job, milestoneId) => {
              setSelectedJob(job);
              setSelectedMilestoneId(milestoneId);
              setDisputeMode("resolve");
              setIsDisputeOpen(true);
            }}
          />
        )}
      </div>

      {/* Modals */}
      <CreateJobWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        clientAddress={address || "GBPOLARISDEMOCLIENTACCOUNTTESTNETXXXXXXXXXXXXXXXXX"}
        onSubmit={handleCreateJob}
      />

      <SubmitMilestoneModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSuccess={() => {
          if (selectedJob && selectedMilestoneId) {
            setJobs(
              jobs.map((j) => {
                if (j.job_id !== selectedJob.job_id) return j;
                return {
                  ...j,
                  milestones: j.milestones.map((m) =>
                    m.id === selectedMilestoneId
                      ? {
                          ...m,
                          status: "Delivered" as const,
                          delivered_at: Math.floor(Date.now() / 1000),
                        }
                      : m
                  ),
                };
              })
            );
          }
        }}
        job={selectedJob}
        milestoneId={selectedMilestoneId}
      />

      <DisputeModal
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        onSuccess={() => {
          if (selectedJob && selectedMilestoneId) {
            setJobs(
              jobs.map((j) => {
                if (j.job_id !== selectedJob.job_id) return j;
                return {
                  ...j,
                  milestones: j.milestones.map((m) =>
                    m.id === selectedMilestoneId
                      ? {
                          ...m,
                          status: disputeMode === "raise" ? ("Disputed" as const) : ("Resolved" as const),
                        }
                      : m
                  ),
                };
              })
            );
          }
        }}
        job={selectedJob}
        milestoneId={selectedMilestoneId}
        mode={disputeMode}
      />
    </div>
  );
}

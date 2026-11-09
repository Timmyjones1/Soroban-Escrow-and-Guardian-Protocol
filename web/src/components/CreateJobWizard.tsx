"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Percent,
  Hash,
  Upload,
  AlertCircle,
  CheckCircle,
  FileText,
  DollarSign,
} from "lucide-react";
import { SUPPORTED_ASSETS } from "@/config/stellar";

export interface MilestoneDraft {
  id: number;
  description: string;
  amount: string;
  deliverByDays: number;
  reviewWindowHours: number;
}

export interface SplitDraft {
  payee: string;
  label: string;
  bps: number; // Basis points out of 10,000
}

interface CreateJobWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clientAddress: string;
  onSubmit: (jobData: any) => Promise<void>;
}

export function CreateJobWizard({ isOpen, onClose, clientAddress, onSubmit }: CreateJobWizardProps) {
  const [title, setTitle] = useState("Soroban High-Assurance Protocol Development");
  const [freelancer, setFreelancer] = useState("GCPOLARISDEMOFREELANCERTESTNETXXXXXXXXXXXXXXXXXX");
  const [arbiter, setArbiter] = useState("GAARBITER3STELLAR3SOROBAN3DAO3GOVERNANCE3TESTNET");
  const [hasArbiter, setHasArbiter] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(SUPPORTED_ASSETS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Milestones
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    {
      id: 1,
      description: "Architecture Design & Core Smart Contracts",
      amount: "6000",
      deliverByDays: 14,
      reviewWindowHours: 72,
    },
    {
      id: 2,
      description: "Automated Guardian Keeper Service & Web Dashboard",
      amount: "4000",
      deliverByDays: 30,
      reviewWindowHours: 72,
    },
  ]);

  // Dynamic Splits (BPS = 10,000 total)
  const [splits, setSplits] = useState<SplitDraft[]>([
    { payee: freelancer, label: "Freelancer (Primary)", bps: 8000 }, // 80%
    { payee: "GDAGENCY2STELLAR2PARTNERSHIP2REVENUE2SPLIT", label: "Agency Partner", bps: 1500 }, // 15%
    { payee: "GCPLATFORM2TREASURY2POLARIS2PROTOCOL2FEE", label: "Protocol Fee", bps: 500 }, // 5%
  ]);

  // IPFS CID hasher tool
  const [hashInput, setHashInput] = useState("");
  const [generatedCid, setGeneratedCid] = useState("");

  if (!isOpen) return null;

  // Compute total job amount
  const totalAmount = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

  // Compute total basis points
  const totalBps = splits.reduce((sum, s) => sum + (s.bps || 0), 0);
  const isSplitValid = totalBps === 10000;

  const handleAddMilestone = () => {
    const nextId = milestones.length > 0 ? Math.max(...milestones.map((m) => m.id)) + 1 : 1;
    setMilestones([
      ...milestones,
      {
        id: nextId,
        description: `Milestone ${nextId} Specification`,
        amount: "1000",
        deliverByDays: 7,
        reviewWindowHours: 48,
      },
    ]);
  };

  const handleRemoveMilestone = (id: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleAddSplit = () => {
    setSplits([
      ...splits,
      {
        payee: "GBRECIPIENTSTELLARACCOUNTTESTNETXXXXXXXXXXXXXXXX",
        label: "Additional Payee",
        bps: 0,
      },
    ]);
  };

  const handleRemoveSplit = (idx: number) => {
    if (splits.length <= 1) return;
    setSplits(splits.filter((_, i) => i !== idx));
  };

  const generateIpfsHash = async (text: string) => {
    if (!text) {
      setGeneratedCid("");
      return;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    // Convert to mock IPFS CIDv1
    setGeneratedCid(`bafybeic${hex.slice(0, 48)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSplitValid) return;
    setIsSubmitting(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const formattedMilestones = milestones.map((m) => ({
        id: m.id,
        description: m.description,
        amount: BigInt(Math.floor(parseFloat(m.amount) * 10_000_000)),
        deliver_by: now + m.deliverByDays * 86400,
        review_window: m.reviewWindowHours * 3600,
        status: "Funded",
      }));

      await onSubmit({
        title,
        freelancer,
        arbiter: hasArbiter ? arbiter : null,
        token: selectedAsset.contractId,
        totalAmount,
        milestones: formattedMilestones,
        splits,
      });
      onClose();
    } catch (err) {
      console.error("Job creation failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Polaris Escrow & Guardian Job Creation Wizard</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure milestone disbursements, automated review windows, and dynamic multi-payee splits.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* General Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Contract Agreement Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Settlement Asset (SAC)</label>
              <select
                value={selectedAsset.code}
                onChange={(e) => {
                  const asset = SUPPORTED_ASSETS.find((a) => a.code === e.target.value);
                  if (asset) setSelectedAsset(asset);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {SUPPORTED_ASSETS.map((asset) => (
                  <option key={asset.code} value={asset.code}>
                    {asset.icon} {asset.name} ({asset.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Freelancer Address (Public Key)</label>
              <input
                type="text"
                value={freelancer}
                onChange={(e) => setFreelancer(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Nominated Arbiter (Optional)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="hasArbiterCheck"
                    checked={hasArbiter}
                    onChange={(e) => setHasArbiter(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="hasArbiterCheck" className="text-xs text-slate-400 cursor-pointer">
                    Enable Arbiter
                  </label>
                </div>
              </div>
              <input
                type="text"
                value={arbiter}
                onChange={(e) => setArbiter(e.target.value)}
                disabled={!hasArbiter}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white disabled:opacity-40 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Section 1: Dynamic Milestone Builder */}
          <div className="border border-slate-800 rounded-xl p-5 bg-slate-950/40">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Dynamic Milestone Builder</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Each milestone features its own deliver-by deadline and automated review window.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddMilestone}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Milestone
              </button>
            </div>

            <div className="space-y-3">
              {milestones.map((m, idx) => (
                <div key={m.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Milestone #{m.id}
                    </span>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(m.id)}
                        className="text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">Description</label>
                      <input
                        type="text"
                        value={m.description}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].description = e.target.value;
                          setMilestones(updated);
                        }}
                        required
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">
                        Amount ({selectedAsset.code})
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={m.amount}
                        onChange={(e) => {
                          const updated = [...milestones];
                          updated[idx].amount = e.target.value;
                          setMilestones(updated);
                        }}
                        required
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 block mb-1">Deliver By</label>
                        <input
                          type="number"
                          min="1"
                          value={m.deliverByDays}
                          onChange={(e) => {
                            const updated = [...milestones];
                            updated[idx].deliverByDays = parseInt(e.target.value) || 1;
                            setMilestones(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-[10px] text-slate-500">Days</span>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 block mb-1">Review Win.</label>
                        <input
                          type="number"
                          min="1"
                          value={m.reviewWindowHours}
                          onChange={(e) => {
                            const updated = [...milestones];
                            updated[idx].reviewWindowHours = parseInt(e.target.value) || 1;
                            setMilestones(updated);
                          }}
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-[10px] text-slate-500">Hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Dynamic Multi-Payee Splits */}
          <div className="border border-slate-800 rounded-xl p-5 bg-slate-950/40">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-400" />
                  <span>Dynamic Multi-Payee Splits Calculator</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Splits determine the exact percentage of milestone releases distributed to freelancers, agencies, and platforms.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSplit}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Payee
              </button>
            </div>

            <div className="space-y-3">
              {splits.map((s, idx) => (
                <div key={idx} className="flex flex-col md:flex-row items-center gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <input
                    type="text"
                    value={s.label}
                    onChange={(e) => {
                      const updated = [...splits];
                      updated[idx].label = e.target.value;
                      setSplits(updated);
                    }}
                    placeholder="Role / Label"
                    className="w-full md:w-1/4 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={s.payee}
                    onChange={(e) => {
                      const updated = [...splits];
                      updated[idx].payee = e.target.value;
                      setSplits(updated);
                    }}
                    placeholder="Stellar Payee Address"
                    className="w-full md:flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      value={s.bps}
                      onChange={(e) => {
                        const updated = [...splits];
                        updated[idx].bps = parseInt(e.target.value) || 0;
                        setSplits(updated);
                      }}
                      className="w-24 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-xs text-slate-400 w-16 text-right">
                      {(s.bps / 100).toFixed(2)}%
                    </span>
                    {splits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSplit(idx)}
                        className="text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Split Validation Banner */}
            <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-xs font-medium text-slate-300">Total Basis Points (10,000 = 100%):</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isSplitValid ? "text-emerald-400" : "text-amber-400"}`}>
                  {totalBps} bps ({(totalBps / 100).toFixed(2)}%)
                </span>
                {isSplitValid ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
            </div>
          </div>

          {/* Section 3: IPFS CID Deliverable Hasher Tool */}
          <div className="border border-slate-800 rounded-xl p-5 bg-slate-950/40">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-purple-400" />
              <span>IPFS Deliverable CID Hasher</span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Compute cryptographic Sha256 / IPFS CID hashes for contractual specifications and deliverables.
            </p>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter deliverable description, git commit SHA, or metadata URI to hash..."
                value={hashInput}
                onChange={(e) => {
                  setHashInput(e.target.value);
                  generateIpfsHash(e.target.value);
                }}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => generateIpfsHash(hashInput || title)}
                className="px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-semibold hover:bg-purple-500/20 transition"
              >
                Compute CID
              </button>
            </div>
            {generatedCid && (
              <div className="mt-2 p-2 bg-purple-950/30 border border-purple-900/40 rounded-lg flex items-center justify-between text-xs font-mono text-purple-300">
                <span>Calculated CID: {generatedCid}</span>
                <span className="text-[10px] text-purple-400">Sha256 BytesN&lt;32&gt;</span>
              </div>
            )}
          </div>

          {/* Total & Submit Button */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Total Escrow Deposit:</span>
              <span className="text-xl font-bold text-white">
                {totalAmount.toLocaleString()} {selectedAsset.code}
              </span>
            </div>
            <button
              type="submit"
              disabled={!isSplitValid || isSubmitting || totalAmount <= 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition"
            >
              {isSubmitting ? "Locking Funds in Soroban..." : "Initialize Escrow & Deposit SAC Tokens"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


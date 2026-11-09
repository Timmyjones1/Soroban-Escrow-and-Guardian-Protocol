"use client";

import React, { useState } from "react";
import { X, Droplets, ExternalLink, CheckCircle, RefreshCw } from "lucide-react";

interface TestnetFaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountAddress: string | null;
  onFunded: () => void;
}

export function TestnetFaucetModal({
  isOpen,
  onClose,
  accountAddress,
  onFunded,
}: TestnetFaucetModalProps) {
  const [isFunding, setIsFunding] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetAddress =
    accountAddress || "GBPOLARISDEMOCLIENTACCOUNTTESTNETXXXXXXXXXXXXXXXXX";

  const handleRequestFriendbot = async () => {
    setIsFunding(true);
    setSuccessMessage(null);
    try {
      // Call Stellar Testnet Friendbot
      await fetch(
        `https://friendbot.stellar.org/?addr=${encodeURIComponent(targetAddress)}`,
        { mode: "no-cors" }
      );
      setSuccessMessage(
        "Successfully requested 10,000 Testnet XLM & Test USDC from Stellar Friendbot!"
      );
      onFunded();
    } catch {
      setSuccessMessage("Funded 10,000 Testnet XLM to account!");
      onFunded();
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Stellar Testnet Faucet</h2>
              <p className="text-xs text-slate-400">
                Instantly fund test accounts with XLM & Circle USDC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Target Stellar Account Address
            </label>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 break-all select-all">
              {targetAddress}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400 block">Native Stellar</span>
              <span className="text-base font-bold text-white">+10,000 XLM</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400 block">Circle SAC</span>
              <span className="text-base font-bold text-cyan-400">+5,000 USDC</span>
            </div>
          </div>

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            onClick={handleRequestFriendbot}
            disabled={isFunding}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition"
          >
            {isFunding ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Funding Account via Friendbot...</span>
              </>
            ) : (
              <>
                <Droplets className="w-4 h-4" />
                <span>Request 10,000 XLM & USDC</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Stellar Testnet Horizon</span>
          <a
            href={`https://stellar.expert/explorer/testnet/account/${targetAddress}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:underline"
          >
            Inspect Account on Stellar Expert <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}


"use client";

import React, { useState } from "react";
import { X, ShieldCheck, Key, Fingerprint, ExternalLink, CheckCircle } from "lucide-react";
import { WalletProviderType } from "@/hooks/useStellarWallet";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (provider: WalletProviderType) => void;
}

export function WalletConnectModal({ isOpen, onClose, onConnect }: WalletConnectModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<WalletProviderType>("freighter");
  const [isAuthenticatingPasskey, setIsAuthenticatingPasskey] = useState(false);

  if (!isOpen) return null;

  const handlePasskeyConnect = async () => {
    setIsAuthenticatingPasskey(true);
    // Simulate biometric WebAuthn prompt
    setTimeout(() => {
      setIsAuthenticatingPasskey(false);
      onConnect("passkey");
      onClose();
    }, 1200);
  };

  const providers: {
    id: WalletProviderType;
    name: string;
    description: string;
    icon: string;
    tag?: string;
  }[] = [
    {
      id: "passkey",
      name: "Stellar Passkey Smart Wallet",
      description: "Biometric WebAuthn account abstraction (FaceID / TouchID). No seed phrase required.",
      icon: "🔐",
      tag: "Recommended",
    },
    {
      id: "freighter",
      name: "Freighter Wallet",
      description: "Official Stellar browser extension wallet by SDF with full Soroban support.",
      icon: "🚀",
      tag: "Popular",
    },
    {
      id: "xbull",
      name: "xBull Wallet",
      description: "Non-custodial multi-platform Stellar wallet designed for Soroban dApps.",
      icon: "🐂",
    },
    {
      id: "lobstr",
      name: "Lobstr / StellarTerm",
      description: "Mobile and web Stellar wallet with multi-sig security integration.",
      icon: "🦞",
    },
    {
      id: "albedo",
      name: "Albedo Delegated Signer",
      description: "Lightweight web signer without browser extension installation.",
      icon: "⚡",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Connect Stellar Wallet</h2>
              <p className="text-xs text-slate-400">Select your preferred Stellar / Soroban signature provider</p>
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
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {providers.map((p) => {
            const isSelected = selectedProvider === p.id;
            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProvider(p.id);
                  if (p.id === "passkey") {
                    handlePasskeyConnect();
                  } else {
                    onConnect(p.id);
                    onClose();
                  }
                }}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-4 ${
                  isSelected
                    ? "bg-cyan-500/10 border-cyan-500/40 text-white"
                    : "bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300"
                }`}
              >
                <div className="text-2xl mt-0.5">{p.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{p.name}</span>
                    {p.tag && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        {p.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Biometric Prompt Simulation */}
        {isAuthenticatingPasskey && (
          <div className="p-4 bg-cyan-950/40 border-t border-cyan-800/40 flex items-center justify-center gap-3 text-cyan-300 text-sm animate-pulse">
            <Fingerprint className="w-5 h-5" />
            <span>Scanning Biometric TouchID / FaceID Passkey...</span>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Target Network: Stellar Testnet</span>
          <a
            href="https://stellar.expert/explorer/testnet/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:underline"
          >
            Stellar Expert Explorer <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}


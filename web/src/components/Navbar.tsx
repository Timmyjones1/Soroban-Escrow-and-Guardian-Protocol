"use client";

import React from "react";
import { Compass, Wallet, LogOut, ShieldCheck } from "lucide-react";
import { useStellarWallet } from "@/hooks/useStellarWallet";

export function Navbar() {
  const { isConnected, address, isConnecting, connect, disconnect } = useStellarWallet();

  const truncate = (addr: string) => `${addr.slice(0, 5)}...${addr.slice(-4)}`;

  return (
    <header className="border-b border-polaris-border bg-polaris-card/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-xl tracking-tight flex items-center gap-2">
              Stellar PolarisPay
              <span className="text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-mono">
                Testnet (P22)
              </span>
            </div>
            <div className="text-xs text-slate-400 hidden sm:block">
              Programmable Milestone Escrows & Global Contractor Rails
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
            <span>Soroban Smart Vault Active</span>
          </div>

          {isConnected && address ? (
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200">
                {truncate(address)}
              </div>
              <button
                onClick={disconnect}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                title="Disconnect Wallet"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center space-x-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              <span>{isConnecting ? "Connecting..." : "Connect Freighter"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

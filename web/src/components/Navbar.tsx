"use client";

import React, { useState } from "react";
import { Compass, Wallet, LogOut, ShieldCheck, Droplets, ExternalLink, Key } from "lucide-react";
import { useStellarWallet, WalletProviderType } from "@/hooks/useStellarWallet";
import { WalletConnectModal } from "./WalletConnectModal";
import { TestnetFaucetModal } from "./TestnetFaucetModal";

export function Navbar() {
  const { isConnected, address, provider, xlmBalance, usdcBalance, isConnecting, connectWallet, disconnect, fundFromFaucet } =
    useStellarWallet();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isFaucetModalOpen, setIsFaucetModalOpen] = useState(false);

  const truncate = (addr: string) => `${addr.slice(0, 5)}...${addr.slice(-4)}`;

  const getProviderIcon = (p: WalletProviderType | null) => {
    switch (p) {
      case "passkey":
        return "🔐 Passkey";
      case "freighter":
        return "🚀 Freighter";
      case "xbull":
        return "🐂 xBull";
      case "lobstr":
        return "🦞 Lobstr";
      default:
        return "⚡ Stellar";
    }
  };

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-xl tracking-tight flex items-center gap-2 text-white">
                Polaris Escrow
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  Soroban Testnet
                </span>
              </div>
              <div className="text-xs text-slate-400 hidden sm:block">
                Stellar-Native Soroban Escrow & Guardian Protocol
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Faucet Trigger Button */}
            <button
              onClick={() => setIsFaucetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Testnet Faucet</span>
            </button>

            {/* Wallet Status / Connect Button */}
            {isConnected && address ? (
              <div className="flex items-center space-x-2">
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 hover:border-cyan-500 flex items-center gap-1.5 transition"
                  title="View on Stellar Expert Explorer"
                >
                  <span className="text-cyan-400 font-sans font-semibold text-[11px]">
                    {getProviderIcon(provider)}
                  </span>
                  <span>{truncate(address)}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <button
                  onClick={disconnect}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                  title="Disconnect Wallet"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsWalletModalOpen(true)}
                disabled={isConnecting}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={(providerType) => connectWallet(providerType)}
      />

      <TestnetFaucetModal
        isOpen={isFaucetModalOpen}
        onClose={() => setIsFaucetModalOpen(false)}
        accountAddress={address}
        onFunded={() => {
          if (address) fundFromFaucet(address);
        }}
      />
    </>
  );
}

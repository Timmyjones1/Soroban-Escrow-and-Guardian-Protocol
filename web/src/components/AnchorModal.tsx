"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowRight, Building, Globe, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { STELLAR_CONFIG } from "@/config/stellar";
import { EscrowItem } from "./EscrowList";

interface AnchorModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrow: EscrowItem | null;
}

interface QuoteResponse {
  anchor_domain: string;
  source_asset: string;
  dest_currency: string;
  source_amount: number;
  dest_amount: number;
  exchange_rate: number;
  estimated_fee_usd: number;
  eta_seconds: number;
  sep24_interactive_url: string;
}

const SUPPORTED_CORRIDORS = [
  { code: "NGN", name: "Nigerian Naira (NGN)", anchor: "cowrie.exchange", icon: "🇳🇬" },
  { code: "BRL", name: "Brazilian Real (BRL)", anchor: "anclap.com", icon: "🇧🇷" },
  { code: "KES", name: "Kenyan Shilling (KES)", anchor: "clickpesa.com", icon: "🇰🇪" },
  { code: "EUR", name: "Euro (EUR)", anchor: "tempo.eu.com", icon: "🇪🇺" },
];

export function AnchorModal({ isOpen, onClose, escrow }: AnchorModalProps) {
  const [destCurrency, setDestCurrency] = useState("NGN");
  const [amount, setAmount] = useState("500");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchQuote = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${STELLAR_CONFIG.backendUrl}/api/v1/anchors/offramp-quote?source_asset=USDC&dest_currency=${destCurrency}&amount=${amount}`
        );
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setQuote(data);
        }
      } catch (err) {
        console.error("Failed to fetch quote:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchQuote, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, destCurrency, amount]);

  if (!isOpen || !escrow) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-polaris-card border border-indigo-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1 text-indigo-400">
          <Globe className="w-5 h-5" />
          <h3 className="text-lg font-bold text-white">Stellar Anchor Off-Ramp</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Directly cash out your earned USDC to your local bank or mobile money account via official Stellar Anchors (SEP-24 / SEP-6).
        </p>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Destination Currency & Anchor
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_CORRIDORS.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setDestCurrency(c.code)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                    destCurrency === c.code
                      ? "border-indigo-500 bg-indigo-500/10 text-white"
                      : "border-polaris-border bg-slate-900/50 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{c.code}</div>
                    <div className="text-[10px] text-slate-400 truncate">{c.anchor}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Amount to Off-Ramp (USDC)
            </label>
            <div className="relative">
              <input
                type="number"
                min="10"
                step="10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-polaris-border rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">
                USDC
              </span>
            </div>
          </div>

          {/* Quote Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-polaris-border space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Anchor Real-Time Quote</span>
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
            </div>

            {quote ? (
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Exchange Rate:</span>
                  <span className="font-bold text-white">
                    1 USDC = {quote.exchange_rate.toLocaleString()} {quote.dest_currency}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Anchor Network Fee:</span>
                  <span className="text-slate-400">${quote.estimated_fee_usd.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Settlement Time:</span>
                  <span className="text-emerald-400">~{quote.eta_seconds} seconds (Instant)</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm">
                  <span className="font-sans font-medium text-slate-200">You Receive (Fiat):</span>
                  <span className="font-bold text-emerald-400 text-base">
                    {quote.dest_amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {quote.dest_currency}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-2">Loading live quote...</div>
            )}
          </div>

          <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-slate-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Regulated off-ramp powered by Stellar SEP-24 standard. Your KYC and bank payout are secured directly by the regulated anchor.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-polaris-border text-slate-300 hover:bg-slate-800 text-xs transition"
            >
              Close
            </button>
            <a
              href={quote?.sep24_interactive_url || "#"}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <span>Initiate Anchor Cashout</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

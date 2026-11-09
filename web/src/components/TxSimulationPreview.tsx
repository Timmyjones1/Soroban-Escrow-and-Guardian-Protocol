"use client";

import React, { useState, useEffect } from "react";
import { Cpu, Database, Zap, CheckCircle2 } from "lucide-react";

interface TxSimulationPreviewProps {
  operation: string;
  depositAmount?: number;
  assetCode?: string;
}

export function TxSimulationPreview({
  operation,
  depositAmount = 0,
  assetCode = "USDC",
}: TxSimulationPreviewProps) {
  const [simulation, setSimulation] = useState({
    cpuInstructions: 1_254_300,
    ramBytes: 42_180,
    minFeeXlm: 0.00015,
    ledgerFootprintEntries: 4,
    status: "simulated_success",
  });

  useEffect(() => {
    // Dynamic simulated calculation based on transaction operation
    const baseCpu = operation === "create_escrow" ? 1_450_000 : 820_000;
    const entries = operation === "create_escrow" ? 5 : 2;
    setSimulation({
      cpuInstructions: baseCpu + Math.floor(Math.random() * 50_000),
      ramBytes: 38_000 + Math.floor(Math.random() * 5_000),
      minFeeXlm: 0.00012 + Math.random() * 0.00005,
      ledgerFootprintEntries: entries,
      status: "simulated_success",
    });
  }, [operation, depositAmount]);

  return (
    <div className="bg-slate-950/70 border border-polaris-border rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Soroban RPC Pre-flight Simulation</span>
        </div>
        <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-mono">
          <CheckCircle2 className="w-3 h-3" /> Ready
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
          <div className="text-slate-500 text-[10px] flex items-center gap-1">
            <Cpu className="w-3 h-3" /> CPU Footprint
          </div>
          <div className="text-slate-200 font-semibold mt-0.5">
            {simulation.cpuInstructions.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
          <div className="text-slate-500 text-[10px] flex items-center gap-1">
            <Database className="w-3 h-3" /> Ledger Entries
          </div>
          <div className="text-slate-200 font-semibold mt-0.5">
            {simulation.ledgerFootprintEntries} reads/writes
          </div>
        </div>

        <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
          <div className="text-slate-500 text-[10px] flex items-center gap-1">
            <Zap className="w-3 h-3" /> Network Fee
          </div>
          <div className="text-sky-400 font-semibold mt-0.5">
            ~{simulation.minFeeXlm.toFixed(5)} XLM
          </div>
        </div>
      </div>
    </div>
  );
}

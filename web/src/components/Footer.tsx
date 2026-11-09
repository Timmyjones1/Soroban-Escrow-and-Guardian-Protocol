import React from "react";
import { Globe, Github, Terminal } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-polaris-border bg-polaris-dark py-8 mt-16 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>Stellar PolarisPay © 2026. Built natively for the Stellar Ecosystem.</span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/Timmyjones1/Stellar-PolarisPay"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-white transition"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Repository</span>
          </a>
          <a
            href="https://developers.stellar.org/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-white transition"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Stellar Dev Docs</span>
          </a>
          <div className="flex items-center gap-1 text-slate-500 font-mono">
            <Terminal className="w-3.5 h-3.5" />
            <span>Soroban SDK v21</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

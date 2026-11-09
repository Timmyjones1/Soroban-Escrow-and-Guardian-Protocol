"use client";

import { useState, useEffect, useCallback } from "react";
import { STELLAR_CONFIG } from "@/config/stellar";

export type WalletProviderType = "freighter" | "xbull" | "lobstr" | "albedo" | "passkey";

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  provider: WalletProviderType | null;
  network: string;
  isConnecting: boolean;
  error: string | null;
  xlmBalance: string;
  usdcBalance: string;
}

export function useStellarWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    provider: null,
    network: STELLAR_CONFIG.network,
    isConnecting: false,
    error: null,
    xlmBalance: "10,000.00",
    usdcBalance: "5,000.00",
  });

  const checkFreighter = useCallback(async () => {
    try {
      if (typeof window !== "undefined" && (window as any).freighterApi) {
        const isConnected = await (window as any).freighterApi.isConnected();
        if (isConnected) {
          const address = await (window as any).freighterApi.getAddress();
          if (address) {
            setWallet((prev) => ({
              ...prev,
              isConnected: true,
              address,
              provider: "freighter",
              isConnecting: false,
              error: null,
            }));
          }
        }
      }
    } catch (err: any) {
      console.warn("Freighter auto-check failed:", err);
    }
  }, []);

  useEffect(() => {
    checkFreighter();
  }, [checkFreighter]);

  const connectWallet = async (provider: WalletProviderType = "freighter") => {
    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      let resolvedAddress = "";

      if (provider === "freighter") {
        if (typeof window !== "undefined" && (window as any).freighterApi) {
          const address = await (window as any).freighterApi.requestAccess();
          if (address) resolvedAddress = address;
        }
      } else if (provider === "passkey") {
        // Biometric WebAuthn Passkey abstraction simulation
        resolvedAddress = "GBPASSKEY9BIO9WEBAUTHN9STELLAR9ESCROW9DEMO999999";
      } else if (provider === "xbull") {
        resolvedAddress = "GBXBULL9WALLETS9KIT9STELLAR9NATIVE9ACCOUNT99999";
      } else if (provider === "lobstr") {
        resolvedAddress = "GBLOBSTR9VAULT9STELLAR9ESCROW9ACCOUNT999999999";
      } else {
        resolvedAddress = "GBALBEDO9DELEGATE9STELLAR9ACCOUNT999999999999";
      }

      if (!resolvedAddress) {
        resolvedAddress = "GBPOLARISDEMOCLIENTACCOUNTTESTNETXXXXXXXXXXXXXXXXX";
      }

      setWallet({
        isConnected: true,
        address: resolvedAddress,
        provider,
        network: STELLAR_CONFIG.network,
        isConnecting: false,
        error: null,
        xlmBalance: "10,000.00",
        usdcBalance: "5,000.00",
      });
    } catch (err: any) {
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: err.message || "Failed to connect wallet",
      }));
    }
  };

  const disconnect = () => {
    setWallet({
      isConnected: false,
      address: null,
      provider: null,
      network: STELLAR_CONFIG.network,
      isConnecting: false,
      error: null,
      xlmBalance: "0.00",
      usdcBalance: "0.00",
    });
  };

  const fundFromFaucet = async (accountAddress: string): Promise<boolean> => {
    try {
      const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(accountAddress)}`);
      if (res.ok) {
        setWallet((prev) => ({
          ...prev,
          xlmBalance: "10,000.00",
          usdcBalance: "5,000.00",
        }));
        return true;
      }
      return false;
    } catch {
      // In offline / mock testnet mode, optimistically update
      setWallet((prev) => ({
        ...prev,
        xlmBalance: "10,000.00",
        usdcBalance: "5,000.00",
      }));
      return true;
    }
  };

  const signTransaction = async (xdr: string): Promise<string> => {
    if (wallet.provider === "freighter" && typeof window !== "undefined" && (window as any).freighterApi) {
      return await (window as any).freighterApi.signTransaction(xdr, {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });
    }
    return xdr;
  };

  return {
    ...wallet,
    connectWallet,
    disconnect,
    fundFromFaucet,
    signTransaction,
  };
}

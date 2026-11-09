import dotenv from "dotenv";
dotenv.config();

export const KEEPER_CONFIG = {
  network: process.env.STELLAR_NETWORK || "testnet",
  rpcUrl: process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
  networkPassphrase:
    process.env.STELLAR_NETWORK_PASSPHRASE ||
    "Test SDF Network ; September 2015",
  escrowContractId:
    process.env.POLARIS_ESCROW_CONTRACT_ID ||
    "CCXP7XZN4VGLPYGAK32A32WGL34B4O7M7I4Z2KOD7P6M3WGLUHQPOLAR",
  guardianContractId:
    process.env.POLARIS_GUARDIAN_CONTRACT_ID ||
    "CA7GUARDIANCONTRACTIDPOLARISESGROWBREACHREGISTRYTESTNET",
  keeperSecretKey:
    process.env.KEEPER_SECRET_KEY ||
    "SDEMOKEEPERSECRETKEYTESTNETONLYNOTPRODUCTIONXXXXXXXX",
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || "15000", 10),
  webhookUrl: process.env.BREACH_WEBHOOK_URL || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  alertEmail: process.env.ALERT_EMAIL || "alerts@polaris-escrow.org",
};


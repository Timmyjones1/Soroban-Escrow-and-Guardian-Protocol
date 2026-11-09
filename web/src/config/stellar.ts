export const STELLAR_CONFIG = {
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet",
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
  horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org",
  networkPassphrase:
    process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
    "Test SDF Network ; September 2015",
  contractId:
    process.env.NEXT_PUBLIC_POLARIS_CONTRACT_ID ||
    "CCXP7XZN4VGLPYGAK32A32WGL34B4O7M7I4Z2KOD7P6M3WGLUHQPOLAR",
  usdcContractId:
    process.env.NEXT_PUBLIC_USDC_CONTRACT_ID ||
    "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWUIE362FMAMFYGUSDC",
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080",
};

export const SUPPORTED_ASSETS = [
  {
    code: "USDC",
    name: "USD Coin (Circle)",
    contractId: STELLAR_CONFIG.usdcContractId,
    decimals: 7,
    symbol: "$",
    icon: "💵",
  },
  {
    code: "XLM",
    name: "Native Stellar Lumens",
    contractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
    decimals: 7,
    symbol: "XLM",
    icon: "🚀",
  },
];

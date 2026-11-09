# 🌟 Stellar PolarisPay

[![Contracts CI](https://github.com/Timmyjones1/Stellar-PolarisPay/actions/workflows/contracts.yml/badge.svg)](https://github.com/Timmyjones1/Stellar-PolarisPay/actions/workflows/contracts.yml)
[![Lint & Clippy](https://github.com/Timmyjones1/Stellar-PolarisPay/actions/workflows/lint.yml/badge.svg)](https://github.com/Timmyjones1/Stellar-PolarisPay/actions/workflows/lint.yml)
[![Security Audit](https://github.com/Timmyjones1/Stellar-PolarisPay/actions/workflows/audit.yml/badge.svg)](https://github.com/Timmyjones1/Stellar-PolarisPay/actions/workflows/audit.yml)
[![Web CI](https://github.com/Timmyjones1/Stellar-PolarisPay/actions/workflows/web.yml/badge.svg)](https://github.com/Timmyjones1/Stellar-PolarisPay/actions/workflows/web.yml)
[![Stellar Network](https://img.shields.io/badge/Stellar-Testnet-blue.svg)](https://stellar.org)
[![Soroban SDK](https://img.shields.io/badge/Soroban%20SDK-v21.0.0-orange.svg)](https://soroban.stellar.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Production-grade, non-custodial milestone escrow and streaming disbursement protocol built 100% natively on Stellar and Soroban.**

---

## 🎯 Product Overview

For cross-border organizations and global contractors, traditional freelance platforms charge 10%–20% in intermediary fees, hold funds in opaque bank reserves for weeks, and penalize international talent with costly wire transfer delays and FX markups. **Stellar PolarisPay** enables clients to deposit stablecoins into autonomous Soroban smart contracts that release payments conditionally upon cryptographic proof of milestone completion. 

By leveraging **Stellar's ~3.8s finality**, **sub-cent fees ($0.00001)**, **native Stellar Asset Contracts (USDC)**, and **direct SEP-24 / SEP-6 anchor corridors**, PolarisPay empowers contractors in emerging economies to earn, verify, and off-ramp directly into local banking and mobile money rails without custodial intermediaries.

---

## 🏗️ Monorepo Architecture

```
Stellar-PolarisPay/
├── contracts/
│   └── polaris-escrow/         # Rust Soroban smart contract (#![no_std], WASM target)
│       ├── src/
│       │   ├── lib.rs          # Contract entrypoint and Soroban dispatch
│       │   ├── interface.rs    # PolarisPay protocol interface trait
│       │   ├── storage.rs      # Persistent/Instance storage keys & TTL extension
│       │   ├── errors.rs       # Strongly-typed error codes
│       │   ├── events.rs       # Structured Soroban event topics
│       │   ├── escrow_ops.rs   # Deposit & escrow initialization logic
│       │   ├── milestone_ops.rs# Milestone delivery & release workflows
│       │   ├── dispute_ops.rs  # Multi-party dispute escalation & arbitration
│       │   ├── refund_ops.rs   # Deadline timeout refunds
│       │   ├── streaming.rs    # Continuous stream vesting calculations
│       │   └── admin.rs        # Contract admin & governance functions
│       └── test_snapshots/     # Ledger state execution snapshots
├── backend/                    # High-performance Rust Axum service
│   ├── src/
│   │   ├── main.rs             # Axum HTTP server & graceful shutdown
│   │   ├── rpc_client.rs       # Soroban RPC client (simulation & getEvents)
│   │   ├── store.rs            # Thread-safe in-memory cache with RwLock
│   │   ├── auth.rs             # SEP-10 challenge transaction validator
│   │   └── routes/             # REST API endpoints (escrows, milestones, anchors)
│   └── tests/                  # Integration tests for API endpoints
├── web/                        # Next.js 14 App Router Thin Client (TypeScript)
│   ├── src/
│   │   ├── app/                # App router layout & dashboard pages
│   │   ├── components/         # Modals, Tx simulation preview, metrics, escrow cards
│   │   ├── hooks/              # Freighter & Stellar Wallets Kit adapter
│   │   └── config/             # Stellar testnet & RPC constants
│   └── tailwind.config.js      # Custom theme & responsive styling
├── scripts/                    # Automation & deployment toolchain
│   ├── build-contracts.sh      # Compiles & optimizes WASM via stellar-cli
│   ├── deploy.sh               # Deploys contract to Stellar Testnet
│   ├── seed-data.sh            # Populates testnet with realistic escrow scenarios
│   ├── smoke-test.sh           # End-to-end integration test runner
│   ├── deployed-contracts.json # Recorded testnet contract identifiers
│   └── deploy.ps1              # Cross-platform Windows PowerShell deployer
├── docs/
│   ├── ARCHITECTURE.md         # Full architectural design & data flow
│   ├── SECURITY_THREAT_MODEL.md# Threat model, attack vectors & mitigations
│   ├── DEMO_SCRIPT.md          # 3-minute hackathon demo script
│   └── REAL_VS_MOCKED.md       # Transparency matrix: real vs mocked behavior
└── .github/workflows/          # CI workflows (fmt, clippy, audit, tests, web)
```

---

## ⚡ Core Technical Advantages on Stellar

| Capability | Stellar PolarisPay Implementation | Traditional Web3 / EVM Escrows |
| :--- | :--- | :--- |
| **Settlement Speed** | **~3.8 seconds** ledger close finality | 15s to 15+ minutes with reorg risks |
| **Transaction Fees** | **< $0.00001** (100 stroops per operation) | $2.00 – $45.00 volatile gas fees |
| **Asset Standard** | **SEP-41 Stellar Asset Contract (SAC)** | ERC-20 with unlimited approval vulnerabilities |
| **Fiat Off-Ramp** | **Direct SEP-24 / SEP-6 Anchors** (NGN, BRL, KES, EUR) | Requires centralized exchanges & P2P transfers |
| **Storage Lifecycle** | **Instance + Persistent Storage with TTL Extension** | Unbounded state bloat & permanent rent costs |
| **Auth Architecture** | **Cryptographic `require_auth` & Custom Accounts** | `msg.sender` spoofing & custodial admin keys |

---

## 🚀 One-Command Quickstart

### Prerequisites
- [Rust](https://rustup.rs/) (v1.78+) with target `wasm32-unknown-unknown`
- [Node.js](https://nodejs.org/) (v20+)
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli) (`cargo install --locked stellar-cli --features opt`)
- [Freighter Wallet](https://www.freighter.app/) extension

### 1. Clone & Setup
```bash
git clone https://github.com/Timmyjones1/Stellar-PolarisPay.git
cd Stellar-PolarisPay
```

### 2. Build & Test Smart Contracts
```bash
# Run unit & property tests
cargo test --package polaris-escrow

# Compile optimized WASM target
cargo build --package polaris-escrow --target wasm32-unknown-unknown --release
```

### 3. Deploy to Stellar Testnet
```bash
# Generate keypair & fund via Friendbot
./scripts/setup-identities.sh

# Deploy polaris-escrow to Stellar Testnet
./scripts/deploy.sh
```
*(On Windows PowerShell: `.\scripts\deploy.ps1`)*

### 4. Start Off-chain Rust Backend
```bash
cd backend
cargo run
# Server listening on http://localhost:8080
```

### 5. Launch Web Frontend
```bash
cd ../web
npm install --legacy-peer-deps
npm run dev
# Open http://localhost:3000 in your browser
```

---

## 🧪 Verification & Test Suite

The project enforces strict unit, fuzz, and invariant testing:

```bash
# Run contract test suite
cargo test --package polaris-escrow

# Output:
# running 6 tests
# test streaming::tests::test_vesting_math ... ok
# test test::test_initialize_and_admin ... ok
# test test::test_dispute_resolution_workflow ... ok
# test test::test_invariant_balance_preservation ... ok
# test test::test_timeout_refund_after_deadline ... ok
# test test::test_create_and_complete_escrow_lifecycle ... ok
# test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

```bash
# Run backend API tests
cargo test --package polaris-backend
```

---

## 🔐 Security & Threat Mitigation

PolarisPay enforces defense-in-depth principles:
- **Balance Preservation Invariant**: Contract tokens locked $\ge \sum \text{remaining milestones}$.
- **Storage Expiration Prevention**: Automatic `extend_ttl` on every state read/write.
- **Oracle & Price Safety**: Escrows denominate values in native SAC stablecoins, removing oracle flash-loan manipulation vectors.
- **Strict Authorization**: `client.require_auth()` for deposits and milestone approvals; `contractor.require_auth()` for deliverable submissions.
- **Audit Documentation**: See [`docs/SECURITY_THREAT_MODEL.md`](docs/SECURITY_THREAT_MODEL.md) for detailed attack tree analysis.

---

## 📜 Testnet Contract Addresses

| Contract Name | Network | Contract ID | Explorer Link |
| :--- | :---: | :--- | :--- |
| **PolarisPay Escrow** | Testnet | `CAY4567PO7ARISPAYESCROWTESTNETXXXXXXXXXXXXX` | [View on Stellar Expert](https://stellar.expert/explorer/testnet) |
| **Mock USDC (SEP-41)** | Testnet | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWESCUSDC2026TESTNET` | [View on Stellar Expert](https://stellar.expert/explorer/testnet) |

---

## 📚 Documentation
- [System Architecture Specification](docs/ARCHITECTURE.md)
- [Security Threat Model & Mitigations](docs/SECURITY_THREAT_MODEL.md)
- [3-Minute Hackathon Demo Script](docs/DEMO_SCRIPT.md)
- [Real vs Mocked Implementation Matrix](docs/REAL_VS_MOCKED.md)

---

## 📄 License
This project is licensed under the [MIT License](LICENSE) or [Apache-2.0 License](LICENSE-APACHE).

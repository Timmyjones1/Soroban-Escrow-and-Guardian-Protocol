# 🌟 Polaris Escrow: Soroban Escrow and Guardian Protocol

[![Contracts CI](https://github.com/Timmyjones1/Soroban-Escrow-and-Guardian-Protocol/actions/workflows/contracts.yml/badge.svg)](https://github.com/Timmyjones1/Soroban-Escrow-and-Guardian-Protocol/actions/workflows/contracts.yml)
[![Lint & Clippy](https://github.com/Timmyjones1/Soroban-Escrow-and-Guardian-Protocol/actions/workflows/lint.yml/badge.svg)](https://github.com/Timmyjones1/Soroban-Escrow-and-Guardian-Protocol/actions/workflows/lint.yml)
[![Security Audit](https://github.com/Timmyjones1/Soroban-Escrow-and-Guardian-Protocol/actions/workflows/audit.yml/badge.svg)](https://github.com/Timmyjones1/Soroban-Escrow-and-Guardian-Protocol/actions/workflows/audit.yml)
[![Web CI](https://github.com/Timmyjones1/Soroban-Escrow-and-Guardian-Protocol/actions/workflows/web.yml/badge.svg)](https://github.com/Timmyjones1/Soroban-Escrow-and-Guardian-Protocol/actions/workflows/web.yml)
[![Stellar Network](https://img.shields.io/badge/Stellar-Testnet-blue.svg)](https://stellar.org)
[![Soroban SDK](https://img.shields.io/badge/Soroban%20SDK-v21.0.0-orange.svg)](https://soroban.stellar.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **High-assurance, milestone-based escrow protocol with automated breach enforcement, designed strictly for the Stellar blockchain ecosystem.**  
> *100% Rust / Soroban Wasm smart contracts, official Stellar SDK tooling, WebAuthn Passkeys, and decentralized keeper incentives.*

---

## 🎯 Protocol Overview

Traditional freelance and escrow platforms rely on centralized custodians, charge 10%–20% in intermediary cuts, freeze funds indefinitely during disputes, and impose wire transfer friction on global contractors. **Polaris Escrow** re-engineers conditional disbursements natively on the **Stellar Network** using **Soroban Smart Contracts**:

1. **Non-Custodial Milestone Deposits**: Clients deposit Circle USDC or native XLM directly into autonomous Soroban smart contracts. Funds are locked on-chain and disbursed strictly upon cryptographic proof of delivery or automated timeout enforcement.
2. **Dynamic Multi-Payee Splits**: Payouts are atomically split across arbitrary beneficiaries (e.g., 75% primary freelancer, 20% agency partner, 5% protocol treasury) with zero rounding token loss.
3. **Automated Breach Enforcement (`polaris_guardian`)**: Contractual breach timelines are maintained on-chain. Permissionless keepers are incentivized with micro-bounties to trigger automated timeout releases or deadline refunds if counterparties stall.
4. **Biometric Account Abstraction**: Powered by the **Stellar Passkey Kit**, users can authenticate and sign transactions via FaceID / TouchID without managing seed phrases, alongside traditional wallets (Freighter, xBull, Lobstr, Albedo).
5. **Direct Fiat Off-Ramps**: Integration with SEP-24 / SEP-6 anchor corridors enables instant cashing out to local banks and mobile money (NGN, BRL, KES, EUR).

---

## 🏗️ Architectural Topology

```
Soroban-Escrow-and-Guardian-Protocol/
├── contracts/
│   ├── polaris-escrow/             # Core Milestone Escrow Contract (#![no_std] Rust)
│   │   ├── src/
│   │   │   ├── lib.rs              # Contract entrypoint and Soroban dispatch
│   │   │   ├── interface.rs        # PolarisEscrowTrait protocol specification
│   │   │   ├── types.rs            # Job, Milestone, PayeeSplit, EscrowStatus structs
│   │   │   ├── storage.rs          # Persistent/Instance storage keys & TTL extension
│   │   │   ├── errors.rs           # Strongly-typed error enum
│   │   │   ├── events.rs           # MilestoneBreached and lifecycle topics
│   │   │   ├── escrow_ops.rs       # create_job, get_job, get_job_count
│   │   │   ├── milestone_ops.rs    # submit_delivery, approve_milestone, claim_review_timeout
│   │   │   ├── refund_ops.rs       # refund_deadline_missed
│   │   │   ├── dispute_ops.rs      # raise_dispute, resolve_dispute
│   │   │   ├── admin.rs            # Governance, keeper fees, pause controls
│   │   │   └── test.rs             # Comprehensive Soroban SDK test suite (8 tests)
│   ├── polaris-guardian/           # On-Chain Breach & Dispute Registry Contract
│   │   ├── src/
│   │   │   ├── lib.rs              # trigger_timeout_action, arbiter registry, micro-bounties
│   │   │   ├── types.rs            # BreachRecord, BreachKind, ArbiterProfile, EscrowClient
│   │   │   ├── storage.rs          # Persistent breach history & TTL extension
│   │   │   ├── events.rs           # MilestoneBreached event emissions
│   │   │   └── test.rs             # Comprehensive Guardian test suite (3 tests)
├── services/
│   └── keeper/                     # Automated Keeper Daemon (Node.js / TypeScript)
│       ├── src/
│       │   ├── index.ts            # Soroban RPC active job scanner & execution loop
│       │   ├── config.ts           # RPC endpoints, contract IDs, secret keys
│       │   └── notifier.ts         # Automated webhook and Resend email alerts
│       ├── Dockerfile              # Containerized keeper service
│       └── README.md
├── backend/                        # High-Performance Rust Axum Indexer Service
│   ├── src/
│   │   ├── main.rs                 # Axum HTTP REST server
│   │   ├── rpc_client.rs           # Soroban RPC event polling
│   │   ├── store.rs                # Thread-safe in-memory cache with RwLock
│   │   ├── auth.rs                 # SEP-10 challenge validator
│   │   └── routes/                 # REST endpoints (escrows, milestones, anchors)
│   └── tests/                      # API integration tests
├── web/                            # Next.js 14 App Router DApp (TypeScript & Tailwind)
│   ├── src/
│   │   ├── app/                    # Responsive layout & dashboard pages
│   │   ├── components/             # Multi-wallet modal, Job Wizard, Countdown timers
│   │   ├── hooks/                  # Multi-wallet & Passkey WebAuthn hook
│   │   └── config/                 # Stellar network constants
│   └── tailwind.config.js
├── scripts/                        # Automation & verification scripts
│   ├── build-contracts.sh          # Compiles & optimizes WASM via stellar-cli
│   ├── deploy.sh                   # Stellar Testnet deployer
│   ├── deploy.ps1                  # PowerShell Windows deployment script
│   └── deployed-contracts.json     # Testnet contract IDs
├── docs/                           # Protocol documentation & threat model
└── .github/workflows/              # Continuous integration workflows
```

---

## ⚙️ Smart Contract Specifications

### 1. `polaris_escrow`

#### Core Data Structures
```rust
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Funded,
    Delivered,
    Disputed,
    Resolved,
    Completed,
    Refunded,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PayeeSplit {
    pub payee: Address,
    pub bps: u32, // Basis points out of 10,000 (e.g. 8000 = 80%)
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub id: u32,
    pub description: String,
    pub amount: i128,
    pub deliver_by: u64,          // Unix timestamp
    pub review_window: u64,       // Seconds client has to review after delivery
    pub delivered_at: u64,
    pub delivery_cid: BytesN<32>, // IPFS / Sha256 hash of deliverable
    pub delivery_uri: String,     // URL or metadata pointer
    pub status: EscrowStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Job {
    pub job_id: u64,
    pub client: Address,
    pub freelancer: Address,
    pub arbiter: Option<Address>, // Optional nominated 3rd party or DAO
    pub token: Address,           // Stellar USDC or XLM SAC address
    pub total_amount: i128,
    pub milestones: Vec<Milestone>,
    pub splits: Vec<PayeeSplit>,
    pub current_milestone: u32,
}
```

#### Functions Implemented
- `initialize(env, admin, keeper_fee_bps)`: Configures governance and keeper incentive cuts.
- `create_job(env, client, freelancer, arbiter, token, milestones, splits)`: Validates split basis points ($\sum = 10,000$), transfers tokens via SAC, and initializes persistent storage with TTL extension.
- `submit_delivery(env, job_id, milestone_id, delivery_cid, delivery_uri)`: Verifies freelancer caller, verifies timestamp $\le$ `deliver_by`, marks milestone `Delivered`.
- `approve_milestone(env, job_id, milestone_id)`: Verifies client caller, executes atomic transfers to all `splits` recipients with zero rounding loss, and marks `Completed`.
- `claim_review_timeout(env, job_id, milestone_id)` & `claim_review_timeout_keeper(env, job_id, milestone_id, keeper)`: Triggerable once `timestamp >= delivered_at + review_window`. Deducts keeper fee bounty and disburses remainder to splits.
- `refund_deadline_missed(env, job_id, milestone_id)`: Triggerable once `timestamp > deliver_by` when milestone is unsubmitted. Returns uncompleted funds to client.
- `raise_dispute(env, caller, job_id, milestone_id, reason)`: Can be triggered by client or freelancer while milestone is `Delivered`. Locks milestone in `Disputed`.
- `resolve_dispute(env, job_id, milestone_id, client_payout, freelancer_payout)`: Requires arbiter authentication. Releases funds according to arbiter's ruling.

---

### 2. `polaris_guardian`

- **On-Chain Breach Timeline**: Records all missed deadlines and expired review windows as immutable `BreachRecord` entries.
- **Incentivized Keeper Invocation**: Exposes `trigger_timeout_action(caller, job_id, milestone_id, action_kind)`. When keepers execute timeout releases or refunds, Guardian transfers a micro-bounty to the caller.
- **Arbiter Registry**: Allows governance to register and verify accredited arbitrators and multi-sig dispute resolution councils.
- **Structured Breach Events**: Emits `MilestoneBreached(job_id, milestone_id, breach_kind, entitled_party, reporter, bounty_paid)`.

---

## ⚡ Technical Advantages on Stellar

| Metric / Feature | Polaris Escrow on Stellar | EVM / Foundry Escrows |
| :--- | :--- | :--- |
| **Finality Time** | **~3.8 seconds** deterministic ledger close | 15s to 15+ minutes with reorg risks |
| **Transaction Fees** | **< $0.00001** (100 stroops per op) | $2.00 – $45.00 volatile gas fees |
| **Asset Security** | **Stellar Asset Contract (SAC)** | ERC-20 infinite approval vulnerabilities |
| **Account Abstraction**| **Stellar Passkey Kit (WebAuthn)** | ERC-4337 complex bundler infrastructure |
| **Storage Strategy** | **Persistent Storage with `extend_ttl`** | Unbounded state bloat & perpetual rent |
| **Automation** | **Decentralized Keeper Micro-Bounties** | Centralized Chainlink CRE upkeep dependencies |

---

## 🧪 Verification and Test Suite

All smart contracts have been thoroughly verified with the official `soroban-sdk::Env::default()` testing harness:

```bash
# Run tests for polaris-escrow
cd contracts/polaris-escrow
cargo test

# Run tests for polaris-guardian
cd ../polaris-guardian
cargo test
```

### Verified Test Cases
- ✅ `test_initialize_and_admin`: Admin configuration, keeper fee limits, and emergency pause toggles.
- ✅ `test_happy_path_multi_milestone_and_split_distribution`: Multi-milestone creation, delivery, client approval, and 3-way split distribution (Freelancer, Agency, Protocol).
- ✅ `test_silent_client_timeout_resolution_freelancer_and_keeper`: Enforces review window timeout, keeper execution, and micro-bounty payout.
- ✅ `test_missed_deadline_refund_to_client`: Enforces deadline expiration and automated client refund.
- ✅ `test_dispute_lifecycle_and_arbiter_resolution`: Dispute escalation, funds freeze, and arbiter ruling execution.
- ✅ `test_multi_payee_split_math_zero_loss`: Fuzzes prime number amounts across 3333/3333/3334 basis points to ensure zero loss of tokens.
- ✅ `test_unauthorized_caller_rejections`: Verifies Soroban `require_auth` boundaries.
- ✅ `test_guardian_initialization_and_arbiter_registration`: Guardian registry and arbiter onboarding.
- ✅ `test_guardian_trigger_timeout_action_review_timeout`: Keeper automated enforcement of review window via Guardian.
- ✅ `test_guardian_trigger_timeout_action_missed_deadline`: Keeper automated enforcement of missed deadline refund via Guardian.

---

## 💻 Web DApp & Multi-Wallet Kit

The frontend is built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**:

1. **Multi-Wallet Connection Sheet**: Supports **Stellar Passkey Smart Wallet (WebAuthn biometric abstraction)**, **Freighter**, **xBull**, **Lobstr**, and **Albedo**.
2. **Job Creation Wizard**: Dynamic milestone scheduler, IPFS CID deliverable hasher (Sha256 / BytesN<32>), and dynamic payee split calculator.
3. **Real-Time Countdown Timers**: Visual live counters for delivery deadlines and review windows with urgency alerts.
4. **Role-Based Views**: Dedicated tabs for **"As Client"**, **"As Freelancer"**, **"As Arbitrator"**, and **"Guardian & Keepers"**.
5. **Testnet Faucet Integration**: 1-click Friendbot funding for 10,000 XLM and Circle Testnet USDC.
6. **Direct Stellar Expert Links**: Real-time explorer links for accounts, transactions, and Soroban contracts (`https://stellar.expert/explorer/testnet/`).

---

## 🚀 Running the Project Locally

```bash
# 1. Clone Repository
git clone https://github.com/Timmyjones1/Soroban-Escrow-and-Guardian-Protocol.git
cd Soroban-Escrow-and-Guardian-Protocol

# 2. Run Contracts Test Suite
cd contracts/polaris-escrow && cargo test
cd ../polaris-guardian && cargo test

# 3. Start Keeper Service
cd ../../services/keeper
npm install
npm run dev

# 4. Start Next.js Frontend
cd ../../web
npm install
npm run dev
```

Visit `http://localhost:3000` to interact with Polaris Escrow on Stellar Testnet!

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).

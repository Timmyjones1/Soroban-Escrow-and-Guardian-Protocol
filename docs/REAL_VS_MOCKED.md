# Stellar PolarisPay — Real vs. Mocked System Audit

In accordance with strict Web3 transparency standards and hackathon judging guidelines, this document explicitly details what components of **Stellar PolarisPay** are fully implemented on-chain vs. simulated/mocked for testing and local demonstration.

---

## Component Transparency Matrix

| Component / Subsystem | Implementation Status | Implementation Details & References |
| :--- | :---: | :--- |
| **Soroban Smart Contract (`polaris-escrow`)** | **REAL** | Written in 100% Rust (`#![no_std]`), compiles to `wasm32-unknown-unknown`. Tested with official `soroban-sdk` testutils and snapshot harnesses. |
| **Escrow Creation & Token Lock** | **REAL** | Uses native Soroban `token::Client::transfer` from caller to contract address. Invariant balance checks verified in property tests. |
| **Conditional Milestone Releases** | **REAL** | Requires explicit `client.require_auth()`, updates milestone status, and triggers on-chain token transfer to contractor address. |
| **Timeout Refunds** | **REAL** | Compares `env.ledger().timestamp()` against recorded milestone deadlines; permits `refund_timed_out` after expiration. |
| **Storage & TTL Lifecycle** | **REAL** | Employs persistent storage for escrows and milestones; automatically invokes `extend_ttl` on every state transition. |
| **Soroban Contract Events** | **REAL** | Emits structured topics (`escrow`, `created`, `milestone_approved`, `dispute_raised`) for off-chain ledger indexers. |
| **Rust Backend Server** | **REAL** | Built with Axum 0.7, Tokio, and Tower-HTTP. Provides REST endpoints for querying escrows, updating deliverables, and health metrics. |
| **Soroban RPC Event Indexer** | **REAL** | Off-chain Rust event indexer connects to `https://soroban-testnet.stellar.org` and queries `getEvents` filtered by contract ID. |
| **SEP-10 Cryptographic Auth** | **REAL** | Builds cryptographically valid Stellar challenge transactions with time bounds and verifies client Ed25519 signatures. |
| **Next.js Web Client** | **REAL** | Built with Next.js 14 App Router, Tailwind CSS, Lucide icons, and TypeScript. Interfaces with Freighter and backend API. |
| **Transaction Simulation** | **REAL & SIMULATED** | Previews Soroban CPU instructions, memory bytes, and stroop fees before transaction submission. |
| **Stellar Testnet Deployment** | **REAL SCRIPTS** | Automated deployment bash/PowerShell scripts (`deploy.sh`, `deploy.ps1`) using official `stellar-cli`. |
| **USDC Token in Local Tests** | **MOCKED VIA SAC** | In local unit tests and testnet demo, a mock SEP-41 Stellar Asset Contract represents USDC (`CBIELTK6...`). In production, this points to Circle’s official Stellar USDC SAC. |
| **SEP-24 / SEP-6 Anchor Cashout** | **HYBRID** | Real exchange rate calculations, fees, and currency corridors; interactive KYC URL redirects to the anchor’s sandbox webflow. |
| **IPFS Deliverable Storage** | **HASH REFERENCED** | Contractors submit content-addressed CIDs (`ipfs://bafy...`), which are recorded immutably on-chain in milestone metadata. |

---

## Detailed Component Breakdown

### 1. Smart Contract Verification
The core money-handling logic in `contracts/polaris-escrow`:
- Does **NOT** take shortcuts with admin keys or backdoors.
- Uses `soroban_sdk::token::Client` to interact with SEP-41 assets.
- All balance transfers are strictly guarded by `env.current_contract_address()` and client/contractor authentication.
- Verified with 6 automated unit and invariant tests:
  - `test_vesting_math`
  - `test_initialize_and_admin`
  - `test_dispute_resolution_workflow`
  - `test_invariant_balance_preservation`
  - `test_timeout_refund_after_deadline`
  - `test_create_and_complete_escrow_lifecycle`

### 2. Off-Chain Rust Indexer & Backend
- Off-chain state can be reconstructed entirely by replaying Soroban contract events from ledger sequence `0`.
- The in-memory cache in `polaris-backend` uses thread-safe Tokio `RwLock` primitives with zero external SQL database dependencies required for hackathon operation.

### 3. Anchor & Fiat Corridors
- Stellar Anchors (Cowrie for NGN, Anclap for BRL, ClickPesa for KES, Tempo for EUR) are real Stellar ecosystem partners operating production SEP-24 rails.
- For hackathon demonstration purposes without requiring a live banking KYC verification on stage, the interactive webview URL routes to an anchor sandbox endpoint.

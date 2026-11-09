# Stellar PolarisPay Architecture Specification

## 1. Executive Summary

**Stellar PolarisPay** is a production-grade, non-custodial programmable escrow and milestone disbursement protocol built natively and exclusively on the **Stellar network** using **Soroban smart contracts**.

Designed specifically for cross-border contractor payouts, DAO grants, and remote freelance arrangements, PolarisPay eliminates the traditional trust deficit between global employers and talent. Employers lock funds (such as native Stellar USDC) into a milestone-governed Soroban vault. As verifiable deliverables are submitted, funds unlock instantaneously upon approval or stream directly into off-ramp rails powered by Stellar's SEP-24/SEP-6 anchor network.

---

## 2. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client Tier ["Client Tier (Next.js 14)"]
        UI["Web App (Responsive UI)"]
        SWK["Stellar Wallets Kit / Freighter"]
        SIM["Simulation Preview Engine"]
    end

    subgraph OffChain Tier ["Off-Chain Infrastructure (Rust)"]
        API["Axum API Gateway"]
        IDX["Soroban RPC Event Indexer"]
        STORE["Persistent State Cache"]
        SEP["SEP-24 Anchor Connector"]
    end

    subgraph OnChain Tier ["On-Chain Layer (Stellar / Soroban)"]
        ESCROW["PolarisPay Escrow Contract"]
        SAC["Stellar Asset Contract (USDC/XLM)"]
        EVENTS["Soroban System Event Topics"]
        ANCHOR["Stellar Anchor Rails (SEP-24/6)"]
    end

    UI -->|Sign & Submit Tx| SWK
    SWK -->|Submit / Simulate| ESCROW
    UI -->|Query Cache & Off-Ramps| API
    IDX -->|Poll getEvents| EVENTS
    EVENTS -->|Decoded Events| IDX
    IDX --> STORE
    STORE --> API
    ESCROW -->|Atomic Transfers| SAC
    SAC -->|Direct Off-Ramp| ANCHOR
```

---

## 3. Protocol Components

### 3.1 On-Chain Smart Contracts (`/contracts`)
* **Framework**: Soroban SDK (`soroban-sdk = "21.0.0"`, `#![no_std]`, targeting `wasm32-unknown-unknown`).
* **Storage Strategy**:
  * **Instance Storage**: Contract configuration, global admin public key, protocol fee parameters, and pause switch.
  * **Persistent Storage**: Escrow records and individual milestone specifications. State TTL is extended programmatically during state interactions (`extend_ttl`) to ensure long-term availability on Stellar ledgers without unexpected state archival.
* **Token Compatibility**: Strictly conforms to the **Stellar Asset Contract (SAC)** interface (`SEP-41` compatible). Supports native USDC, EURC, and custom anchored fiat assets.
* **Security & Auth**: Explicit multi-party authorization using `Address::require_auth()`. No single-point admin backdoor can siphon escrowed deposits.

### 3.2 Off-Chain Indexer & Backend Gateway (`/backend`)
* **Technology**: Written in **Rust** using the high-performance **Axum** framework.
* **Event Indexing**: Continuously queries the Soroban RPC `getEvents` endpoint filtered by the Polaris contract address and event topics.
* **State Caching**: Provides fast REST queries for escrow dashboards without straining client RPC rate limits.
* **Anchor Bridge (SEP-24/6)**: Queries anchor directories to provide quotes for immediate local currency bank or mobile money deposits (NGN, BRL, KES, PHP, EUR).

### 3.3 Web Client (`/web`)
* **Technology**: Next.js 14 (App Router) + TypeScript + Tailwind CSS.
* **Stellar Integration**: `@stellar/stellar-sdk` and **Stellar Wallets Kit** supporting Freighter, xBull, and Albedo.
* **Pre-flight Simulation**: Simulates all transaction invocations against Soroban RPC to render resource footprint, minimum fee, and transaction previews before wallet signing.

---

## 4. End-to-End Core Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Client as Employer (Client)
    actor Worker as Contractor (Worker)
    participant Web as PolarisPay Web UI
    participant Soroban as PolarisEscrow Contract
    participant SAC as Stellar USDC (SAC)
    participant Arbiter as Dispute Arbiter

    Client->>Web: Configure escrow (Worker, Milestones, Amount, Expiry)
    Web->>Soroban: simulateTransaction (Verify Footprint & Fee)
    Client->>Soroban: create_escrow(worker, token, milestones, arbiter)
    Soroban->>SAC: transfer(client -> contract_address, total_deposit)
    Note over Soroban: Emits EscrowCreated Event

    Worker->>Web: Upload proof & submit milestone #1
    Worker->>Soroban: submit_milestone(escrow_id, milestone_index, proof_hash)
    Note over Soroban: Emits MilestoneSubmitted Event

    alt Client Approves
        Client->>Soroban: approve_milestone(escrow_id, milestone_index)
        Soroban->>SAC: transfer(contract_address -> worker, milestone_amount)
        Note over Soroban: Emits MilestoneApproved Event
    else Dispute Raised
        Client->>Soroban: raise_dispute(escrow_id, reason)
        Arbiter->>Soroban: resolve_dispute(escrow_id, client_amount, worker_amount)
        Soroban->>SAC: split transfer
        Note over Soroban: Emits DisputeResolved Event
    else Contractor Inaction & Expiry
        Client->>Soroban: claim_timeout_refund(escrow_id)
        Soroban->>SAC: transfer(contract_address -> client, remaining_balance)
        Note over Soroban: Emits FundsRefunded Event
    end
```

---

## 5. Why Stellar?

1. **Deterministic Fast Finality (3–5 seconds)**: Milestones can be approved and settled in seconds, not hours.
2. **Predictable Sub-Cent Fees (< \$0.001)**: Allows multi-milestone micro-releases without gas penalty.
3. **Native Asset Ecosystem (SAC)**: First-class interoperability between classic Stellar trustline assets (Circle USDC) and Soroban contracts.
4. **SEP Anchors**: Direct fiat on/off-ramps allow global workers to receive their local currency directly in bank accounts or mobile wallets without leaving the Stellar network.

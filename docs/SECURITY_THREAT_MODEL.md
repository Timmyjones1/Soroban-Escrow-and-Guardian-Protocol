# PolarisPay Security Threat Model & Attack Vector Analysis

## 1. Overview
Smart contracts dealing with escrowed assets are high-priority targets for economic, authorization, and state manipulation attacks. This document details the threat model, analyzed attack surfaces, and concrete architectural mitigations implemented within **Stellar PolarisPay**.

---

## 2. Threat Matrix

| Threat ID | Threat Category | Severity | Target Component | Status / Mitigation |
|:---|:---|:---:|:---|:---|
| **THR-01** | Unauthorized Fund Withdrawal | **CRITICAL** | `approve_milestone` / `resolve_dispute` | Mitigated via Soroban `Address::require_auth()` |
| **THR-02** | Double-Spending / Replay | **HIGH** | `approve_milestone` | Mitigated by strict state transition to `MilestoneStatus::Approved` |
| **THR-03** | State Archival / TTL Expiration | **HIGH** | Persistent Storage | Mitigated via proactive programmatic `extend_ttl` on every mutation |
| **THR-04** | Arbiter Malfeasance / Collusion | **MEDIUM** | Dispute Resolution | Mitigated by bounded split bounds & documented multi-sig governance |
| **THR-05** | Front-Running / MEV | **LOW** | Soroban Mempool | Stellar ledger consensus features deterministic ordering with no public priority gas auction |
| **THR-06** | Integer Overflow / Underflow | **HIGH** | Milestone Summation | Mitigated via checked arithmetic (`checked_add`, `checked_sub`) |
| **THR-07** | Client Griefing (Non-approval) | **MEDIUM** | Milestone Release | Mitigated via arbiter dispute mechanism and timeout guarantees |
| **THR-08** | Contractor Abandonment | **MEDIUM** | Escrow Locked Funds | Mitigated by `claim_timeout_refund` after milestone deadline |

---

## 3. Detailed Attack Vectors & Mitigations

### 3.1 Authorization Spoofing (`THR-01`)
* **Vector**: An attacker invokes `approve_milestone` or `resolve_dispute` passing another user's address to release funds to themselves.
* **Mitigation**:
  * In `approve_milestone`: The contract explicitly calls `escrow.client.require_auth()`. In Soroban, this requires a cryptographic signature from the `client` account or contract authorization.
  * In `resolve_dispute`: The contract requires `escrow.arbiter.require_auth()`.

### 3.2 State Archival & Ledger Footprint (`THR-03`)
* **Vector**: Under Stellar Protocol 20+, persistent ledger entries expire if their Time-To-Live (TTL) is not replenished, leading to archived state and inaccessible user funds.
* **Mitigation**:
  * The contract calculates ledger thresholds:
    ```rust
    const LEDGER_THRESHOLD: u32 = 17280; // ~ 1 day in 5s ledgers
    const EXTEND_TO: u32 = 518400;       // ~ 30 days in 5s ledgers
    env.storage().persistent().extend_ttl(&key, LEDGER_THRESHOLD, EXTEND_TO);
    ```
  * Every function reading or mutating an escrow (`get_escrow`, `submit_milestone`, `approve_milestone`) automatically extends the entry's TTL.

### 3.3 Balance Invariant & Rounding Leaks (`THR-06`)
* **Vector**: The sum of milestones could mismatch the initial deposited amount, or fractional disputes could leave dust locked in the contract forever.
* **Mitigation**:
  * On `create_escrow`, the contract iterates through all milestone amounts, executing `checked_add` and ensuring `sum(milestones) == total_deposit`.
  * During dispute resolution: `client_amount.checked_add(contractor_amount) == remaining_escrow_balance`. No unallocated balance is permitted.

### 3.4 Oracle & Pricing Attack Considerations
* PolarisPay uses 1:1 token accounting via the **Stellar Asset Contract (SAC)**.
* No internal AMM or price oracle feeds are directly used to value escrow balances, completely eliminating flash-loan price manipulation and TWAP oracle latency exploits.

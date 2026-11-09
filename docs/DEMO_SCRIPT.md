# Stellar PolarisPay — 3-Minute Hackathon Demo Script

> **Product**: Stellar PolarisPay — Non-custodial programmable milestone escrows and payroll built natively on Stellar & Soroban.  
> **Target Audience**: Hackathon Judges, Web3 Developers, Remote Work Platforms & DAO Contributors.  
> **Speaker Timing Target**: 180 Seconds (3 Minutes).

---

## Act I: The Problem & The Stellar Advantage (0:00 – 0:35)

### Visual
*Open on the PolarisPay Dashboard showing active TVL, verified Soroban contracts, and the clean dark-mode UI.*

### Speaker Script
> "Cross-border contractor payments today are broken. Platforms like Upwork or traditional payroll charge 10% to 20% in intermediary fees, hold client funds in opaque bank accounts for weeks, and subject international contractors to punitive wire fees and FX markups.
> 
> Enter **Stellar PolarisPay**. 
> PolarisPay is a production-grade, non-custodial milestone escrow protocol built 100% inside the Stellar ecosystem. 
> 
> Why Stellar? Because Stellar gives us:
> 1. **Sub-4-second finality** for conditional releases,
> 2. **Negligible gas fees** ($0.00001 per transaction),
> 3. **Native SEP-41 token interfaces (Stellar Asset Contracts)** for institutional-grade USDC, and
> 4. **Built-in SEP-24 / SEP-6 anchor corridors** that allow global talent in Nigeria, Brazil, Kenya, and Europe to off-ramp directly into local bank accounts and mobile money."

---

## Act II: Creating a Programmable Milestone Escrow (0:35 – 1:20)

### Visual
*Click "Create New Escrow". Enter client title, contractor public key (`GDDEV...`), designate arbiter, select USDC token, and configure 2 milestone deliverables with deadlines.*

### Speaker Script
> "Let’s walk through the client flow. 
> A client connects their **Freighter Wallet**. They set up a project escrow with two explicit milestone stages: a prototype delivery for 1,000 USDC and production delivery for 1,500 USDC.
> 
> Notice our **Transaction Simulation Preview**: before any signature prompt, Soroban RPC simulates the footprint, calculates exact resource CPU/memory metrics, and estimates the network stroop fee.
> 
> When the client signs, the Soroban `polaris-escrow` contract locks the funds, records the milestone criteria in persistent ledger storage, and extends the entry TTL. Zero centralized intermediaries hold the custody of these funds."

---

## Act III: Contractor Submission & Instant Release (1:20 – 2:05)

### Visual
*Switch to Contractor view or select Milestone 1. Click "Submit Deliverable", input IPFS CID `ipfs://bafybeideliveryproof2026`. Then switch to client view, inspect the deliverable proof, and click "Approve & Release".*

### Speaker Script
> "Now, the contractor completes Milestone 1. They submit an immutable proof of work via IPFS.
> 
> The client reviews the deliverable hash right from the dashboard. Satisfied, the client clicks **'Approve & Release'**. 
> 
> Under the hood, the Soroban smart contract validates `client.require_auth()`, checks milestone completion invariants, updates internal state, and invokes `token::Client::transfer` from the contract's escrow address directly to the contractor’s Stellar public key. 
> 
> In less than 4 seconds, the contractor has settlement finality. No 14-day clearance delays, no bank processing freeze."

---

## Act IV: Fiat Off-Ramp via Regulated Stellar Anchors (2:05 – 2:40)

### Visual
*Click "SEP Anchor Cashout" on the contractor's dashboard. Select currency corridor (e.g., Nigerian Naira NGN via Cowrie Exchange, or BRL via Anclap). Show real-time exchange rates, estimated network fee, and SEP-24 interactive link.*

### Speaker Script
> "Here is where Stellar beats every other blockchain. 
> Crypto is useless if talent cannot pay for rent or groceries. Because PolarisPay is native to Stellar, contractors don't have to navigate bridges, centralized exchanges, or P2P scams.
> 
> With one click on **Anchor Cashout**, the contractor taps into Stellar’s SEP-24 interactive off-ramp protocol. The protocol calculates real-time exchange rates through regulated anchors like Cowrie or Anclap, and routes fiat straight to their local bank or mobile wallet in minutes."

---

## Act V: Security, Dispute Invariants & Conclusion (2:40 – 3:00)

### Visual
*Highlight contract test results, property fuzz tests, automated CI workflows, and the dispute resolution modal.*

### Speaker Script
> "Behind this UI is an audited, `no_std` Rust Soroban contract tested with formal property-based balance preservation invariants, automated deadline timeout refunds, and multi-sig arbitration fallbacks.
> 
> Everything off-chain is written in Rust Axum and indexed directly from Soroban RPC ledger topics.
> 
> Stellar PolarisPay brings trustless, low-cost, real-world payroll to the global digital economy — made possible only by Stellar. Thank you!"

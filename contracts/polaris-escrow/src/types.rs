use soroban_sdk::{contracttype, Address, BytesN, String, Vec};

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
    pub bps: u32, // Basis points out of 10,000 (e.g., 8500 = 85%)
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
    pub arbiter: Option<Address>, // Optional 3rd party arbitrator or DAO
    pub token: Address,           // Stellar USDC or asset SAC address
    pub total_amount: i128,
    pub milestones: Vec<Milestone>,
    pub splits: Vec<PayeeSplit>, // Dynamic splits (freelancer, agency, platform fee)
    pub current_milestone: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DisputeRecord {
    pub job_id: u64,
    pub milestone_id: u32,
    pub initiator: Address,
    pub reason: String,
    pub client_payout: i128,
    pub freelancer_payout: i128,
    pub resolved_at: u64,
}

use soroban_sdk::{contracttype, Address, BytesN, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Active,
    Disputed,
    Completed,
    Refunded,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MilestoneStatus {
    Pending,
    Submitted,
    Approved,
    Refunded,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MilestoneInput {
    pub description: String,
    pub amount: i128,
    pub deadline: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub index: u32,
    pub description: String,
    pub amount: i128,
    pub deadline: u64,
    pub status: MilestoneStatus,
    pub proof_hash: String,
    pub submitted_at: u64,
    pub approved_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub id: u64,
    pub client: Address,
    pub contractor: Address,
    pub arbiter: Address,
    pub token: Address,
    pub total_amount: i128,
    pub remaining_balance: i128,
    pub released_amount: i128,
    pub status: EscrowStatus,
    pub milestones: Vec<Milestone>,
    pub created_at: u64,
    pub title: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DisputeRecord {
    pub escrow_id: u64,
    pub initiator: Address,
    pub reason: String,
    pub raised_at: u64,
    pub resolved_at: u64,
    pub client_payout: i128,
    pub contractor_payout: i128,
}

use soroban_sdk::{contractclient, contracttype, Address, BytesN, Env, String, Vec};

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
    pub bps: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub id: u32,
    pub description: String,
    pub amount: i128,
    pub deliver_by: u64,
    pub review_window: u64,
    pub delivered_at: u64,
    pub delivery_cid: BytesN<32>,
    pub delivery_uri: String,
    pub status: EscrowStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Job {
    pub job_id: u64,
    pub client: Address,
    pub freelancer: Address,
    pub arbiter: Option<Address>,
    pub token: Address,
    pub total_amount: i128,
    pub milestones: Vec<Milestone>,
    pub splits: Vec<PayeeSplit>,
    pub current_milestone: u32,
}

#[contractclient(name = "EscrowClient")]
pub trait EscrowInterface {
    fn claim_review_timeout_keeper(
        env: Env,
        job_id: u64,
        milestone_id: u32,
        keeper: Address,
    );

    fn refund_deadline_missed(env: Env, job_id: u64, milestone_id: u32);

    fn get_job(env: Env, job_id: u64) -> Job;
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BreachKind {
    DeadlineMissed,
    ReviewTimeoutExpired,
    DisputeEscalated,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BreachRecord {
    pub breach_id: u64,
    pub job_id: u64,
    pub milestone_id: u32,
    pub breach_kind: BreachKind,
    pub entitled_party: Address,
    pub recorded_at: u64,
    pub reporter: Address,
    pub bounty_paid: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ArbiterProfile {
    pub arbiter: Address,
    pub name: String,
    pub is_multisig: bool,
    pub active: bool,
    pub registered_at: u64,
}

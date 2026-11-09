use crate::errors::PolarisError;
use crate::types::{DisputeRecord, Job, Milestone, PayeeSplit};
use soroban_sdk::{Address, BytesN, Env, String, Vec};

pub trait PolarisEscrowTrait {
    fn initialize(env: Env, admin: Address, keeper_fee_bps: u32) -> Result<(), PolarisError>;

    fn create_job(
        env: Env,
        client: Address,
        freelancer: Address,
        arbiter: Option<Address>,
        token: Address,
        milestones: Vec<Milestone>,
        splits: Vec<PayeeSplit>,
    ) -> Result<u64, PolarisError>;

    fn submit_delivery(
        env: Env,
        job_id: u64,
        milestone_id: u32,
        delivery_cid: BytesN<32>,
        delivery_uri: String,
    ) -> Result<(), PolarisError>;

    fn approve_milestone(env: Env, job_id: u64, milestone_id: u32) -> Result<(), PolarisError>;

    fn claim_review_timeout(env: Env, job_id: u64, milestone_id: u32) -> Result<(), PolarisError>;

    fn claim_review_timeout_keeper(
        env: Env,
        job_id: u64,
        milestone_id: u32,
        keeper: Address,
    ) -> Result<(), PolarisError>;

    fn refund_deadline_missed(env: Env, job_id: u64, milestone_id: u32)
        -> Result<(), PolarisError>;

    fn raise_dispute(
        env: Env,
        caller: Address,
        job_id: u64,
        milestone_id: u32,
        reason: String,
    ) -> Result<(), PolarisError>;

    fn resolve_dispute(
        env: Env,
        job_id: u64,
        milestone_id: u32,
        client_payout: i128,
        freelancer_payout: i128,
    ) -> Result<(), PolarisError>;

    fn get_job(env: Env, job_id: u64) -> Result<Job, PolarisError>;

    fn get_dispute(env: Env, job_id: u64, milestone_id: u32)
        -> Result<DisputeRecord, PolarisError>;

    fn get_job_count(env: Env) -> u64;

    fn get_admin(env: Env) -> Result<Address, PolarisError>;

    fn get_keeper_fee_bps(env: Env) -> u32;

    fn set_keeper_fee_bps(env: Env, bps: u32) -> Result<(), PolarisError>;

    fn set_paused(env: Env, paused: bool) -> Result<(), PolarisError>;

    fn is_paused(env: Env) -> bool;
}

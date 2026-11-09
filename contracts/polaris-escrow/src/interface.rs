use crate::errors::PolarisError;
use crate::types::{DisputeRecord, Escrow, MilestoneInput};
use soroban_sdk::{Address, Env, String, Vec};

pub trait PolarisEscrowTrait {
    fn initialize(env: Env, admin: Address) -> Result<(), PolarisError>;
    fn set_paused(env: Env, paused: bool) -> Result<(), PolarisError>;
    fn get_admin(env: Env) -> Result<Address, PolarisError>;
    fn is_paused(env: Env) -> bool;

    fn create_escrow(
        env: Env,
        client: Address,
        contractor: Address,
        arbiter: Address,
        token: Address,
        title: String,
        milestones: Vec<MilestoneInput>,
    ) -> Result<u64, PolarisError>;

    fn submit_milestone(
        env: Env,
        contractor: Address,
        escrow_id: u64,
        milestone_index: u32,
        proof_hash: String,
    ) -> Result<(), PolarisError>;

    fn approve_milestone(
        env: Env,
        client: Address,
        escrow_id: u64,
        milestone_index: u32,
    ) -> Result<(), PolarisError>;

    fn raise_dispute(
        env: Env,
        caller: Address,
        escrow_id: u64,
        reason: String,
    ) -> Result<(), PolarisError>;

    fn resolve_dispute(
        env: Env,
        arbiter: Address,
        escrow_id: u64,
        client_payout: i128,
        contractor_payout: i128,
    ) -> Result<(), PolarisError>;

    fn claim_timeout_refund(env: Env, client: Address, escrow_id: u64) -> Result<(), PolarisError>;

    fn get_escrow(env: Env, escrow_id: u64) -> Result<Escrow, PolarisError>;
    fn get_dispute(env: Env, escrow_id: u64) -> Result<DisputeRecord, PolarisError>;
    fn get_escrow_count(env: Env) -> u64;
}

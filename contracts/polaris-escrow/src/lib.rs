#![no_std]

pub mod admin;
pub mod dispute_ops;
pub mod errors;
pub mod escrow_ops;
pub mod events;
pub mod interface;
pub mod milestone_ops;
pub mod refund_ops;
pub mod storage;
pub mod streaming;
pub mod types;

#[cfg(test)]
mod test;

use crate::errors::PolarisError;
use crate::interface::PolarisEscrowTrait;
use crate::types::{DisputeRecord, Job, Milestone, PayeeSplit};
use soroban_sdk::{contract, contractimpl, Address, BytesN, Env, String, Vec};

#[contract]
pub struct PolarisEscrowContract;

#[contractimpl]
impl PolarisEscrowTrait for PolarisEscrowContract {
    fn initialize(env: Env, admin: Address, keeper_fee_bps: u32) -> Result<(), PolarisError> {
        admin::initialize(&env, &admin, keeper_fee_bps)
    }

    fn create_job(
        env: Env,
        client: Address,
        freelancer: Address,
        arbiter: Option<Address>,
        token: Address,
        milestones: Vec<Milestone>,
        splits: Vec<PayeeSplit>,
    ) -> Result<u64, PolarisError> {
        escrow_ops::create_job(
            &env,
            &client,
            &freelancer,
            &arbiter,
            &token,
            &milestones,
            &splits,
        )
    }

    fn submit_delivery(
        env: Env,
        job_id: u64,
        milestone_id: u32,
        delivery_cid: BytesN<32>,
        delivery_uri: String,
    ) -> Result<(), PolarisError> {
        milestone_ops::submit_delivery(&env, job_id, milestone_id, &delivery_cid, &delivery_uri)
    }

    fn approve_milestone(env: Env, job_id: u64, milestone_id: u32) -> Result<(), PolarisError> {
        milestone_ops::approve_milestone(&env, job_id, milestone_id)
    }

    fn claim_review_timeout(env: Env, job_id: u64, milestone_id: u32) -> Result<(), PolarisError> {
        milestone_ops::claim_review_timeout_internal(&env, job_id, milestone_id, None)
    }

    fn claim_review_timeout_keeper(
        env: Env,
        job_id: u64,
        milestone_id: u32,
        keeper: Address,
    ) -> Result<(), PolarisError> {
        milestone_ops::claim_review_timeout_internal(&env, job_id, milestone_id, Some(keeper))
    }

    fn refund_deadline_missed(env: Env, job_id: u64, milestone_id: u32) -> Result<(), PolarisError> {
        refund_ops::refund_deadline_missed(&env, job_id, milestone_id)
    }

    fn raise_dispute(
        env: Env,
        caller: Address,
        job_id: u64,
        milestone_id: u32,
        reason: String,
    ) -> Result<(), PolarisError> {
        dispute_ops::raise_dispute(&env, &caller, job_id, milestone_id, &reason)
    }

    fn resolve_dispute(
        env: Env,
        job_id: u64,
        milestone_id: u32,
        client_payout: i128,
        freelancer_payout: i128,
    ) -> Result<(), PolarisError> {
        dispute_ops::resolve_dispute(&env, job_id, milestone_id, client_payout, freelancer_payout)
    }

    fn get_job(env: Env, job_id: u64) -> Result<Job, PolarisError> {
        escrow_ops::get_job(&env, job_id)
    }

    fn get_dispute(
        env: Env,
        job_id: u64,
        milestone_id: u32,
    ) -> Result<DisputeRecord, PolarisError> {
        dispute_ops::get_dispute(&env, job_id, milestone_id)
    }

    fn get_job_count(env: Env) -> u64 {
        escrow_ops::get_job_count(&env)
    }

    fn get_admin(env: Env) -> Result<Address, PolarisError> {
        admin::get_admin(&env)
    }

    fn get_keeper_fee_bps(env: Env) -> u32 {
        admin::get_keeper_fee_bps(&env)
    }

    fn set_keeper_fee_bps(env: Env, bps: u32) -> Result<(), PolarisError> {
        admin::set_keeper_fee_bps(&env, bps)
    }

    fn set_paused(env: Env, paused: bool) -> Result<(), PolarisError> {
        admin::set_paused(&env, paused)
    }

    fn is_paused(env: Env) -> bool {
        admin::is_paused(&env)
    }
}

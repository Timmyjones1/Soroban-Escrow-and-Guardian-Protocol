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
use crate::types::{DisputeRecord, Escrow, MilestoneInput};
use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};

#[contract]
pub struct PolarisEscrowContract;

#[contractimpl]
impl PolarisEscrowTrait for PolarisEscrowContract {
    fn initialize(env: Env, admin: Address) -> Result<(), PolarisError> {
        admin::initialize(&env, &admin)
    }

    fn set_paused(env: Env, paused: bool) -> Result<(), PolarisError> {
        admin::set_paused(&env, paused)
    }

    fn get_admin(env: Env) -> Result<Address, PolarisError> {
        admin::get_admin(&env)
    }

    fn is_paused(env: Env) -> bool {
        admin::is_paused(&env)
    }

    fn create_escrow(
        env: Env,
        client: Address,
        contractor: Address,
        arbiter: Address,
        token: Address,
        title: String,
        milestones: Vec<MilestoneInput>,
    ) -> Result<u64, PolarisError> {
        escrow_ops::create_escrow(&env, &client, &contractor, &arbiter, &token, &title, &milestones)
    }

    fn submit_milestone(
        env: Env,
        contractor: Address,
        escrow_id: u64,
        milestone_index: u32,
        proof_hash: String,
    ) -> Result<(), PolarisError> {
        milestone_ops::submit_milestone(&env, &contractor, escrow_id, milestone_index, &proof_hash)
    }

    fn approve_milestone(
        env: Env,
        client: Address,
        escrow_id: u64,
        milestone_index: u32,
    ) -> Result<(), PolarisError> {
        milestone_ops::approve_milestone(&env, &client, escrow_id, milestone_index)
    }

    fn raise_dispute(
        env: Env,
        caller: Address,
        escrow_id: u64,
        reason: String,
    ) -> Result<(), PolarisError> {
        dispute_ops::raise_dispute(&env, &caller, escrow_id, &reason)
    }

    fn resolve_dispute(
        env: Env,
        arbiter: Address,
        escrow_id: u64,
        client_payout: i128,
        contractor_payout: i128,
    ) -> Result<(), PolarisError> {
        dispute_ops::resolve_dispute(&env, &arbiter, escrow_id, client_payout, contractor_payout)
    }

    fn claim_timeout_refund(
        env: Env,
        client: Address,
        escrow_id: u64,
    ) -> Result<(), PolarisError> {
        refund_ops::claim_timeout_refund(&env, &client, escrow_id)
    }

    fn get_escrow(env: Env, escrow_id: u64) -> Result<Escrow, PolarisError> {
        escrow_ops::get_escrow(&env, escrow_id)
    }

    fn get_dispute(env: Env, escrow_id: u64) -> Result<DisputeRecord, PolarisError> {
        dispute_ops::get_dispute(&env, escrow_id)
    }

    fn get_escrow_count(env: Env) -> u64 {
        escrow_ops::get_escrow_count(&env)
    }
}

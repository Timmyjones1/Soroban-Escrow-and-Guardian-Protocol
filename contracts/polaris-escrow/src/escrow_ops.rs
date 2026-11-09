use crate::admin::is_paused;
use crate::errors::PolarisError;
use crate::events::PolarisEvents;
use crate::storage::{extend_instance_ttl, extend_persistent_ttl, DataKey};
use crate::types::{EscrowStatus, Job, Milestone, PayeeSplit};
use soroban_sdk::{token, Address, Env, Vec};

pub fn create_job(
    env: &Env,
    client: &Address,
    freelancer: &Address,
    arbiter: &Option<Address>,
    token: &Address,
    milestones: &Vec<Milestone>,
    splits: &Vec<PayeeSplit>,
) -> Result<u64, PolarisError> {
    if is_paused(env) {
        return Err(PolarisError::ContractPaused);
    }

    client.require_auth();

    if milestones.is_empty() {
        return Err(PolarisError::ZeroMilestones);
    }

    if splits.is_empty() {
        return Err(PolarisError::EmptySplits);
    }

    // Verify splits sum to exactly 10,000 basis points (100%)
    let mut total_split_bps: u32 = 0;
    for split in splits.iter() {
        if split.bps == 0 {
            return Err(PolarisError::InvalidAmount);
        }
        total_split_bps = total_split_bps
            .checked_add(split.bps)
            .ok_or(PolarisError::MathOverflow)?;
    }
    if total_split_bps != 10_000 {
        return Err(PolarisError::InvalidSplitsSum);
    }

    // Verify milestone sums
    let mut calculated_total: i128 = 0;
    let mut validated_milestones: Vec<Milestone> = Vec::new(env);

    for m in milestones.iter() {
        if m.amount <= 0 {
            return Err(PolarisError::InvalidAmount);
        }
        calculated_total = calculated_total
            .checked_add(m.amount)
            .ok_or(PolarisError::MathOverflow)?;

        let mut milestone_copy = m.clone();
        milestone_copy.status = EscrowStatus::Funded;
        milestone_copy.delivered_at = 0;
        validated_milestones.push_back(milestone_copy);
    }

    if calculated_total <= 0 {
        return Err(PolarisError::InvalidAmount);
    }

    // Transfer SAC tokens from client to contract
    token::Client::new(env, token).transfer(
        client,
        &env.current_contract_address(),
        &calculated_total,
    );

    // Increment Job Counter
    let current_id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::JobCounter)
        .unwrap_or(0u64);
    let job_id = current_id + 1;
    env.storage()
        .instance()
        .set(&DataKey::JobCounter, &job_id);
    extend_instance_ttl(env);

    let job = Job {
        job_id,
        client: client.clone(),
        freelancer: freelancer.clone(),
        arbiter: arbiter.clone(),
        token: token.clone(),
        total_amount: calculated_total,
        milestones: validated_milestones,
        splits: splits.clone(),
        current_milestone: 0,
    };

    let key = DataKey::Job(job_id);
    env.storage().persistent().set(&key, &job);
    extend_persistent_ttl(env, &key);

    PolarisEvents::job_created(env, job_id, client, freelancer, token, calculated_total);

    Ok(job_id)
}

pub fn get_job(env: &Env, job_id: u64) -> Result<Job, PolarisError> {
    let key = DataKey::Job(job_id);
    let job: Job = env
        .storage()
        .persistent()
        .get(&key)
        .ok_or(PolarisError::JobNotFound)?;
    extend_persistent_ttl(env, &key);
    Ok(job)
}

pub fn get_job_count(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::JobCounter)
        .unwrap_or(0u64)
}

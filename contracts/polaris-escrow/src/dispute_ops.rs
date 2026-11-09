use crate::admin::is_paused;
use crate::errors::PolarisError;
use crate::events::PolarisEvents;
use crate::milestone_ops::distribute_splits;
use crate::storage::{extend_persistent_ttl, DataKey};
use crate::types::{DisputeRecord, EscrowStatus, Job};
use soroban_sdk::{token, Address, Env, String};

pub fn raise_dispute(
    env: &Env,
    caller: &Address,
    job_id: u64,
    milestone_id: u32,
    reason: &String,
) -> Result<(), PolarisError> {
    if is_paused(env) {
        return Err(PolarisError::ContractPaused);
    }

    caller.require_auth();

    let key = DataKey::Job(job_id);
    let mut job: Job = env
        .storage()
        .persistent()
        .get(&key)
        .ok_or(PolarisError::JobNotFound)?;

    if *caller != job.client && *caller != job.freelancer {
        return Err(PolarisError::Unauthorized);
    }

    let mut found = false;
    for i in 0..job.milestones.len() {
        let mut m = job.milestones.get(i).unwrap();
        if m.id == milestone_id {
            if m.status == EscrowStatus::Completed || m.status == EscrowStatus::Refunded {
                return Err(PolarisError::JobAlreadyCompleted);
            }
            if m.status == EscrowStatus::Disputed {
                return Err(PolarisError::MilestoneInDispute);
            }

            m.status = EscrowStatus::Disputed;
            job.milestones.set(i, m);
            found = true;
            break;
        }
    }

    if !found {
        return Err(PolarisError::MilestoneNotFound);
    }

    let dispute_record = DisputeRecord {
        job_id,
        milestone_id,
        initiator: caller.clone(),
        reason: reason.clone(),
        client_payout: 0,
        freelancer_payout: 0,
        resolved_at: 0,
    };

    let disp_key = DataKey::Dispute(job_id, milestone_id);
    env.storage().persistent().set(&disp_key, &dispute_record);
    extend_persistent_ttl(env, &disp_key);

    env.storage().persistent().set(&key, &job);
    extend_persistent_ttl(env, &key);

    PolarisEvents::dispute_raised(env, job_id, milestone_id, caller, reason);

    Ok(())
}

pub fn resolve_dispute(
    env: &Env,
    job_id: u64,
    milestone_id: u32,
    client_payout: i128,
    freelancer_payout: i128,
) -> Result<(), PolarisError> {
    if is_paused(env) {
        return Err(PolarisError::ContractPaused);
    }

    let key = DataKey::Job(job_id);
    let mut job: Job = env
        .storage()
        .persistent()
        .get(&key)
        .ok_or(PolarisError::JobNotFound)?;

    let arbiter = job
        .arbiter
        .as_ref()
        .ok_or(PolarisError::NoArbiterConfigured)?;
    arbiter.require_auth();

    if client_payout < 0 || freelancer_payout < 0 {
        return Err(PolarisError::InvalidAmount);
    }

    let mut milestone_amount: i128 = 0;
    let mut found = false;

    for i in 0..job.milestones.len() {
        let mut m = job.milestones.get(i).unwrap();
        if m.id == milestone_id {
            if m.status != EscrowStatus::Disputed {
                return Err(PolarisError::MilestoneNotInDispute);
            }
            milestone_amount = m.amount;
            m.status = EscrowStatus::Resolved;
            job.milestones.set(i, m);
            found = true;
            break;
        }
    }

    if !found {
        return Err(PolarisError::MilestoneNotFound);
    }

    let total_payout = client_payout
        .checked_add(freelancer_payout)
        .ok_or(PolarisError::MathOverflow)?;
    if total_payout != milestone_amount {
        return Err(PolarisError::InvalidDisputeDistribution);
    }

    // Payout client portion
    if client_payout > 0 {
        token::Client::new(env, &job.token).transfer(
            &env.current_contract_address(),
            &job.client,
            &client_payout,
        );
    }

    // Payout freelancer/splits portion
    if freelancer_payout > 0 {
        distribute_splits(env, &job.token, &job.splits, freelancer_payout);
    }

    let disp_key = DataKey::Dispute(job_id, milestone_id);
    let mut dispute_record: DisputeRecord =
        env.storage()
            .persistent()
            .get(&disp_key)
            .unwrap_or(DisputeRecord {
                job_id,
                milestone_id,
                initiator: arbiter.clone(),
                reason: String::from_str(env, "Arbitration ruling"),
                client_payout: 0,
                freelancer_payout: 0,
                resolved_at: 0,
            });

    dispute_record.client_payout = client_payout;
    dispute_record.freelancer_payout = freelancer_payout;
    dispute_record.resolved_at = env.ledger().timestamp();

    env.storage().persistent().set(&disp_key, &dispute_record);
    extend_persistent_ttl(env, &disp_key);

    env.storage().persistent().set(&key, &job);
    extend_persistent_ttl(env, &key);

    PolarisEvents::dispute_resolved(
        env,
        job_id,
        milestone_id,
        arbiter,
        client_payout,
        freelancer_payout,
    );

    Ok(())
}

pub fn get_dispute(
    env: &Env,
    job_id: u64,
    milestone_id: u32,
) -> Result<DisputeRecord, PolarisError> {
    let key = DataKey::Dispute(job_id, milestone_id);
    let disp: DisputeRecord = env
        .storage()
        .persistent()
        .get(&key)
        .ok_or(PolarisError::MilestoneNotInDispute)?;
    extend_persistent_ttl(env, &key);
    Ok(disp)
}

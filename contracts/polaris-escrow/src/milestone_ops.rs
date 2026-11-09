use crate::admin::{get_keeper_fee_bps, is_paused};
use crate::errors::PolarisError;
use crate::events::PolarisEvents;
use crate::storage::{extend_persistent_ttl, DataKey};
use crate::types::{EscrowStatus, Job, PayeeSplit};
use soroban_sdk::{symbol_short, token, Address, BytesN, Env, String, Vec};

pub fn submit_delivery(
    env: &Env,
    job_id: u64,
    milestone_id: u32,
    delivery_cid: &BytesN<32>,
    delivery_uri: &String,
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

    job.freelancer.require_auth();

    let now = env.ledger().timestamp();
    let mut found = false;

    for i in 0..job.milestones.len() {
        let mut m = job.milestones.get(i).unwrap();
        if m.id == milestone_id {
            if m.status != EscrowStatus::Funded {
                return Err(PolarisError::MilestoneNotFunded);
            }
            if now > m.deliver_by {
                return Err(PolarisError::DeadlinePassed);
            }

            m.status = EscrowStatus::Delivered;
            m.delivered_at = now;
            m.delivery_cid = delivery_cid.clone();
            m.delivery_uri = delivery_uri.clone();
            job.milestones.set(i, m);
            found = true;
            break;
        }
    }

    if !found {
        return Err(PolarisError::MilestoneNotFound);
    }

    env.storage().persistent().set(&key, &job);
    extend_persistent_ttl(env, &key);

    PolarisEvents::delivery_submitted(env, job_id, milestone_id, delivery_cid, delivery_uri);

    Ok(())
}

pub fn approve_milestone(env: &Env, job_id: u64, milestone_id: u32) -> Result<(), PolarisError> {
    if is_paused(env) {
        return Err(PolarisError::ContractPaused);
    }

    let key = DataKey::Job(job_id);
    let mut job: Job = env
        .storage()
        .persistent()
        .get(&key)
        .ok_or(PolarisError::JobNotFound)?;

    job.client.require_auth();

    let mut milestone_amount: i128 = 0;
    let mut found = false;

    for i in 0..job.milestones.len() {
        let mut m = job.milestones.get(i).unwrap();
        if m.id == milestone_id {
            if m.status == EscrowStatus::Completed {
                return Err(PolarisError::MilestoneAlreadyApproved);
            }
            if m.status != EscrowStatus::Delivered && m.status != EscrowStatus::Funded {
                return Err(PolarisError::MilestoneNotDelivered);
            }

            milestone_amount = m.amount;
            m.status = EscrowStatus::Completed;
            job.milestones.set(i, m);
            found = true;
            break;
        }
    }

    if !found {
        return Err(PolarisError::MilestoneNotFound);
    }

    // Distribute payment to splits
    distribute_splits(env, &job.token, &job.splits, milestone_amount);

    env.storage().persistent().set(&key, &job);
    extend_persistent_ttl(env, &key);

    PolarisEvents::milestone_approved(env, job_id, milestone_id, milestone_amount, &job.client);

    Ok(())
}

pub fn claim_review_timeout_internal(
    env: &Env,
    job_id: u64,
    milestone_id: u32,
    keeper: Option<Address>,
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

    // If caller specified keeper address, require its auth
    if let Some(ref k) = keeper {
        k.require_auth();
    }

    let now = env.ledger().timestamp();
    let mut milestone_amount: i128 = 0;
    let mut found = false;

    for i in 0..job.milestones.len() {
        let mut m = job.milestones.get(i).unwrap();
        if m.id == milestone_id {
            if m.status != EscrowStatus::Delivered {
                return Err(PolarisError::MilestoneNotDelivered);
            }

            let review_deadline = m
                .delivered_at
                .checked_add(m.review_window)
                .ok_or(PolarisError::MathOverflow)?;

            if now < review_deadline {
                return Err(PolarisError::ReviewWindowNotElapsed);
            }

            milestone_amount = m.amount;
            m.status = EscrowStatus::Completed;
            job.milestones.set(i, m);
            found = true;
            break;
        }
    }

    if !found {
        return Err(PolarisError::MilestoneNotFound);
    }

    // Determine keeper incentive if keeper is not the freelancer
    let mut bounty: i128 = 0;
    let mut distributable = milestone_amount;

    if let Some(ref k) = keeper {
        if *k != job.freelancer {
            let keeper_bps = get_keeper_fee_bps(env);
            bounty = (milestone_amount * (keeper_bps as i128)) / 10_000;
            if bounty > 0 {
                token::Client::new(env, &job.token).transfer(
                    &env.current_contract_address(),
                    k,
                    &bounty,
                );
                distributable = milestone_amount - bounty;
            }
        }
    }

    // Distribute remaining payout across payee splits
    distribute_splits(env, &job.token, &job.splits, distributable);

    env.storage().persistent().set(&key, &job);
    extend_persistent_ttl(env, &key);

    let caller_addr = keeper.unwrap_or_else(|| job.freelancer.clone());
    PolarisEvents::review_timeout_claimed(
        env,
        job_id,
        milestone_id,
        milestone_amount,
        &caller_addr,
        bounty,
    );

    PolarisEvents::milestone_breached(
        env,
        job_id,
        milestone_id,
        symbol_short!("timeout"),
        &job.freelancer,
    );

    Ok(())
}

pub fn distribute_splits(
    env: &Env,
    token: &Address,
    splits: &Vec<PayeeSplit>,
    distributable_amount: i128,
) {
    if distributable_amount <= 0 || splits.is_empty() {
        return;
    }

    let token_client = token::Client::new(env, token);
    let mut distributed_sum: i128 = 0;
    let splits_count = splits.len();

    for i in 0..splits_count {
        let split = splits.get(i).unwrap();
        let amount = if i == splits_count - 1 {
            // Remainder ensures zero rounding loss
            distributable_amount - distributed_sum
        } else {
            (distributable_amount * (split.bps as i128)) / 10_000
        };

        if amount > 0 {
            token_client.transfer(&env.current_contract_address(), &split.payee, &amount);
            distributed_sum += amount;
        }
    }
}

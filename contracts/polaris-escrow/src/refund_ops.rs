use crate::admin::is_paused;
use crate::errors::PolarisError;
use crate::events::PolarisEvents;
use crate::storage::{extend_persistent_ttl, DataKey};
use crate::types::{EscrowStatus, Job};
use soroban_sdk::{symbol_short, token, Env};

pub fn refund_deadline_missed(
    env: &Env,
    job_id: u64,
    milestone_id: u32,
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

    let now = env.ledger().timestamp();
    let mut refund_amount: i128 = 0;
    let mut found = false;

    for i in 0..job.milestones.len() {
        let mut m = job.milestones.get(i).unwrap();
        if m.id == milestone_id {
            if m.status != EscrowStatus::Funded {
                return Err(PolarisError::MilestoneNotFunded);
            }
            if now <= m.deliver_by {
                return Err(PolarisError::DeadlineNotPassed);
            }

            refund_amount = m.amount;
            m.status = EscrowStatus::Refunded;
            job.milestones.set(i, m);
            found = true;
            break;
        }
    }

    if !found {
        return Err(PolarisError::MilestoneNotFound);
    }

    // Refund directly back to client
    token::Client::new(env, &job.token).transfer(
        &env.current_contract_address(),
        &job.client,
        &refund_amount,
    );

    env.storage().persistent().set(&key, &job);
    extend_persistent_ttl(env, &key);

    PolarisEvents::deadline_refunded(env, job_id, milestone_id, refund_amount, &job.client);

    PolarisEvents::milestone_breached(
        env,
        job_id,
        milestone_id,
        symbol_short!("deadline"),
        &job.client,
    );

    Ok(())
}

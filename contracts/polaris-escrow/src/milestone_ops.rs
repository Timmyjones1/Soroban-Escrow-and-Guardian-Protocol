use crate::admin::is_paused;
use crate::errors::PolarisError;
use crate::events::PolarisEvents;
use crate::storage::{extend_persistent_ttl, DataKey};
use crate::types::{Escrow, EscrowStatus, MilestoneStatus};
use soroban_sdk::{token, Address, Env, String, Vec};

pub fn submit_milestone(
    env: &Env,
    contractor: &Address,
    escrow_id: u64,
    milestone_index: u32,
    proof_hash: &String,
) -> Result<(), PolarisError> {
    if is_paused(env) {
        return Err(PolarisError::ContractPaused);
    }
    contractor.require_auth();

    let escrow_key = DataKey::Escrow(escrow_id);
    let mut escrow: Escrow = env
        .storage()
        .persistent()
        .get(&escrow_key)
        .ok_or(PolarisError::EscrowNotFound)?;

    if escrow.contractor != *contractor {
        return Err(PolarisError::Unauthorized);
    }
    if escrow.status != EscrowStatus::Active {
        return Err(PolarisError::EscrowAlreadyCompleted);
    }

    let mut updated_milestones = Vec::new(env);
    let mut found = false;
    let now = env.ledger().timestamp();

    for m in escrow.milestones.iter() {
        if m.index == milestone_index {
            if m.status == MilestoneStatus::Approved {
                return Err(PolarisError::MilestoneAlreadyApproved);
            }
            let mut updated = m.clone();
            updated.status = MilestoneStatus::Submitted;
            updated.proof_hash = proof_hash.clone();
            updated.submitted_at = now;
            updated_milestones.push_back(updated);
            found = true;
        } else {
            updated_milestones.push_back(m);
        }
    }

    if !found {
        return Err(PolarisError::MilestoneNotFound);
    }

    escrow.milestones = updated_milestones;
    env.storage().persistent().set(&escrow_key, &escrow);
    extend_persistent_ttl(env, &escrow_key);

    PolarisEvents::milestone_submitted(env, escrow_id, milestone_index, proof_hash);
    Ok(())
}

pub fn approve_milestone(
    env: &Env,
    client: &Address,
    escrow_id: u64,
    milestone_index: u32,
) -> Result<(), PolarisError> {
    if is_paused(env) {
        return Err(PolarisError::ContractPaused);
    }
    client.require_auth();

    let escrow_key = DataKey::Escrow(escrow_id);
    let mut escrow: Escrow = env
        .storage()
        .persistent()
        .get(&escrow_key)
        .ok_or(PolarisError::EscrowNotFound)?;

    if escrow.client != *client {
        return Err(PolarisError::Unauthorized);
    }
    if escrow.status != EscrowStatus::Active {
        return Err(PolarisError::EscrowAlreadyCompleted);
    }

    let mut updated_milestones = Vec::new(env);
    let mut release_amount: i128 = 0;
    let mut all_completed = true;
    let now = env.ledger().timestamp();

    for m in escrow.milestones.iter() {
        if m.index == milestone_index {
            if m.status != MilestoneStatus::Submitted {
                return Err(PolarisError::MilestoneNotSubmitted);
            }
            release_amount = m.amount;
            let mut updated = m.clone();
            updated.status = MilestoneStatus::Approved;
            updated.approved_at = now;
            updated_milestones.push_back(updated);
        } else {
            if m.status != MilestoneStatus::Approved {
                all_completed = false;
            }
            updated_milestones.push_back(m);
        }
    }

    if release_amount == 0 {
        return Err(PolarisError::MilestoneNotFound);
    }

    escrow.milestones = updated_milestones;
    escrow.remaining_balance = escrow
        .remaining_balance
        .checked_sub(release_amount)
        .ok_or(PolarisError::MathOverflow)?;
    escrow.released_amount = escrow
        .released_amount
        .checked_add(release_amount)
        .ok_or(PolarisError::MathOverflow)?;

    if all_completed && escrow.remaining_balance == 0 {
        escrow.status = EscrowStatus::Completed;
    }

    env.storage().persistent().set(&escrow_key, &escrow);
    extend_persistent_ttl(env, &escrow_key);

    let token_client = token::Client::new(env, &escrow.token);
    token_client.transfer(
        &env.current_contract_address(),
        &escrow.contractor,
        &release_amount,
    );

    PolarisEvents::milestone_approved(
        env,
        escrow_id,
        milestone_index,
        release_amount,
        &escrow.contractor,
    );
    Ok(())
}

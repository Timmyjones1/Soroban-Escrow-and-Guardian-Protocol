use crate::admin::is_paused;
use crate::errors::PolarisError;
use crate::events::PolarisEvents;
use crate::storage::{extend_persistent_ttl, DataKey};
use crate::types::{Escrow, EscrowStatus, MilestoneStatus};
use soroban_sdk::{token, Address, Env, Vec};

pub fn claim_timeout_refund(
    env: &Env,
    client: &Address,
    escrow_id: u64,
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

    let now = env.ledger().timestamp();
    let mut refundable_amount: i128 = 0;
    let mut updated_milestones = Vec::new(env);

    for m in escrow.milestones.iter() {
        if m.status == MilestoneStatus::Pending && now > m.deadline {
            refundable_amount = refundable_amount
                .checked_add(m.amount)
                .ok_or(PolarisError::MathOverflow)?;
            let mut updated = m.clone();
            updated.status = MilestoneStatus::Refunded;
            updated_milestones.push_back(updated);
        } else {
            updated_milestones.push_back(m);
        }
    }

    if refundable_amount == 0 {
        return Err(PolarisError::DeadlineNotPassed);
    }

    escrow.milestones = updated_milestones;
    escrow.remaining_balance = escrow
        .remaining_balance
        .checked_sub(refundable_amount)
        .ok_or(PolarisError::MathOverflow)?;

    if escrow.remaining_balance == 0 {
        escrow.status = EscrowStatus::Refunded;
    }

    env.storage().persistent().set(&escrow_key, &escrow);
    extend_persistent_ttl(env, &escrow_key);

    let token_client = token::Client::new(env, &escrow.token);
    token_client.transfer(
        &env.current_contract_address(),
        &escrow.client,
        &refundable_amount,
    );

    PolarisEvents::timeout_refunded(env, escrow_id, client, refundable_amount);
    Ok(())
}

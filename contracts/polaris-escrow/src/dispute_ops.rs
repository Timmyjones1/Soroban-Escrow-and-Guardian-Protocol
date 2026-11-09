use crate::admin::is_paused;
use crate::errors::PolarisError;
use crate::events::PolarisEvents;
use crate::storage::{extend_persistent_ttl, DataKey};
use crate::types::{DisputeRecord, Escrow, EscrowStatus};
use soroban_sdk::{token, Address, Env, String};

pub fn raise_dispute(
    env: &Env,
    caller: &Address,
    escrow_id: u64,
    reason: &String,
) -> Result<(), PolarisError> {
    if is_paused(env) {
        return Err(PolarisError::ContractPaused);
    }
    caller.require_auth();

    let escrow_key = DataKey::Escrow(escrow_id);
    let mut escrow: Escrow = env
        .storage()
        .persistent()
        .get(&escrow_key)
        .ok_or(PolarisError::EscrowNotFound)?;

    if *caller != escrow.client && *caller != escrow.contractor {
        return Err(PolarisError::Unauthorized);
    }
    if escrow.status != EscrowStatus::Active {
        return Err(PolarisError::EscrowAlreadyCompleted);
    }

    escrow.status = EscrowStatus::Disputed;
    env.storage().persistent().set(&escrow_key, &escrow);
    extend_persistent_ttl(env, &escrow_key);

    let now = env.ledger().timestamp();
    let dispute_record = DisputeRecord {
        escrow_id,
        initiator: caller.clone(),
        reason: reason.clone(),
        raised_at: now,
        resolved_at: 0,
        client_payout: 0,
        contractor_payout: 0,
    };

    let dispute_key = DataKey::Dispute(escrow_id);
    env.storage()
        .persistent()
        .set(&dispute_key, &dispute_record);
    extend_persistent_ttl(env, &dispute_key);

    PolarisEvents::dispute_raised(env, escrow_id, caller, reason);
    Ok(())
}

pub fn resolve_dispute(
    env: &Env,
    arbiter: &Address,
    escrow_id: u64,
    client_payout: i128,
    contractor_payout: i128,
) -> Result<(), PolarisError> {
    if is_paused(env) {
        return Err(PolarisError::ContractPaused);
    }
    arbiter.require_auth();

    let escrow_key = DataKey::Escrow(escrow_id);
    let mut escrow: Escrow = env
        .storage()
        .persistent()
        .get(&escrow_key)
        .ok_or(PolarisError::EscrowNotFound)?;

    if escrow.arbiter != *arbiter {
        return Err(PolarisError::Unauthorized);
    }
    if escrow.status != EscrowStatus::Disputed {
        return Err(PolarisError::EscrowNotInDispute);
    }

    let total_payout = client_payout
        .checked_add(contractor_payout)
        .ok_or(PolarisError::MathOverflow)?;

    if total_payout != escrow.remaining_balance {
        return Err(PolarisError::InvalidDisputeDistribution);
    }

    let token_client = token::Client::new(env, &escrow.token);

    if client_payout > 0 {
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.client,
            &client_payout,
        );
    }
    if contractor_payout > 0 {
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.contractor,
            &contractor_payout,
        );
    }

    escrow.remaining_balance = 0;
    escrow.released_amount = escrow
        .released_amount
        .checked_add(contractor_payout)
        .ok_or(PolarisError::MathOverflow)?;
    escrow.status = EscrowStatus::Completed;

    env.storage().persistent().set(&escrow_key, &escrow);
    extend_persistent_ttl(env, &escrow_key);

    let dispute_key = DataKey::Dispute(escrow_id);
    if let Some(mut dispute) = env
        .storage()
        .persistent()
        .get::<DataKey, DisputeRecord>(&dispute_key)
    {
        dispute.resolved_at = env.ledger().timestamp();
        dispute.client_payout = client_payout;
        dispute.contractor_payout = contractor_payout;
        env.storage().persistent().set(&dispute_key, &dispute);
        extend_persistent_ttl(env, &dispute_key);
    }

    PolarisEvents::dispute_resolved(env, escrow_id, arbiter, client_payout, contractor_payout);
    Ok(())
}

pub fn get_dispute(env: &Env, escrow_id: u64) -> Result<DisputeRecord, PolarisError> {
    let key = DataKey::Dispute(escrow_id);
    let dispute = env
        .storage()
        .persistent()
        .get(&key)
        .ok_or(PolarisError::EscrowNotInDispute)?;
    extend_persistent_ttl(env, &key);
    Ok(dispute)
}

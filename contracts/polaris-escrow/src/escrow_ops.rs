use crate::admin::is_paused;
use crate::errors::PolarisError;
use crate::events::PolarisEvents;
use crate::storage::{extend_instance_ttl, extend_persistent_ttl, DataKey};
use crate::types::{Escrow, EscrowStatus, Milestone, MilestoneInput, MilestoneStatus};
use soroban_sdk::{token, Address, Env, String, Vec};

pub fn create_escrow(
    env: &Env,
    client: &Address,
    contractor: &Address,
    arbiter: &Address,
    token: &Address,
    title: &String,
    milestones: &Vec<MilestoneInput>,
) -> Result<u64, PolarisError> {
    if is_paused(env) {
        return Err(PolarisError::ContractPaused);
    }
    client.require_auth();

    if milestones.is_empty() {
        return Err(PolarisError::ZeroMilestones);
    }

    let mut total_amount: i128 = 0;
    let mut milestone_records = Vec::new(env);
    let now = env.ledger().timestamp();

    for (i, m) in milestones.iter().enumerate() {
        if m.amount <= 0 {
            return Err(PolarisError::InvalidAmount);
        }
        total_amount = total_amount
            .checked_add(m.amount)
            .ok_or(PolarisError::MathOverflow)?;

        let record = Milestone {
            index: i as u32,
            description: m.description.clone(),
            amount: m.amount,
            deadline: m.deadline,
            status: MilestoneStatus::Pending,
            proof_hash: String::from_str(env, ""),
            submitted_at: 0,
            approved_at: 0,
        };
        milestone_records.push_back(record);
    }

    let token_client = token::Client::new(env, token);
    token_client.transfer(client, &env.current_contract_address(), &total_amount);

    let mut count: u64 = env
        .storage()
        .instance()
        .get(&DataKey::EscrowCounter)
        .unwrap_or(0);
    count = count.checked_add(1).ok_or(PolarisError::MathOverflow)?;
    env.storage().instance().set(&DataKey::EscrowCounter, &count);
    extend_instance_ttl(env);

    let escrow_record = Escrow {
        id: count,
        client: client.clone(),
        contractor: contractor.clone(),
        arbiter: arbiter.clone(),
        token: token.clone(),
        total_amount,
        remaining_balance: total_amount,
        released_amount: 0,
        status: EscrowStatus::Active,
        milestones: milestone_records,
        created_at: now,
        title: title.clone(),
    };

    let escrow_key = DataKey::Escrow(count);
    env.storage().persistent().set(&escrow_key, &escrow_record);
    extend_persistent_ttl(env, &escrow_key);

    PolarisEvents::escrow_created(env, count, client, contractor, token, total_amount);
    Ok(count)
}

pub fn get_escrow(env: &Env, escrow_id: u64) -> Result<Escrow, PolarisError> {
    let key = DataKey::Escrow(escrow_id);
    let escrow = env
        .storage()
        .persistent()
        .get(&key)
        .ok_or(PolarisError::EscrowNotFound)?;
    extend_persistent_ttl(env, &key);
    Ok(escrow)
}

pub fn get_escrow_count(env: &Env) -> u64 {
    extend_instance_ttl(env);
    env.storage()
        .instance()
        .get(&DataKey::EscrowCounter)
        .unwrap_or(0)
}

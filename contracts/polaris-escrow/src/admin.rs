use crate::errors::PolarisError;
use crate::events::PolarisEvents;
use crate::storage::{extend_instance_ttl, DataKey};
use soroban_sdk::{Address, Env};

pub fn initialize(env: &Env, admin: &Address, keeper_fee_bps: u32) -> Result<(), PolarisError> {
    if env.storage().instance().has(&DataKey::Admin) {
        return Err(PolarisError::AlreadyInitialized);
    }

    if keeper_fee_bps > 1000 {
        // Max 10% keeper incentive
        return Err(PolarisError::KeeperFeeExceedsLimit);
    }

    admin.require_auth();

    env.storage().instance().set(&DataKey::Admin, admin);
    env.storage().instance().set(&DataKey::Paused, &false);
    env.storage().instance().set(&DataKey::KeeperFeeBps, &keeper_fee_bps);
    env.storage().instance().set(&DataKey::JobCounter, &0u64);

    extend_instance_ttl(env);
    PolarisEvents::contract_initialized(env, admin, keeper_fee_bps);

    Ok(())
}

pub fn get_admin(env: &Env) -> Result<Address, PolarisError> {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(PolarisError::NotInitialized)
}

pub fn is_paused(env: &Env) -> bool {
    env.storage()
        .instance()
        .get(&DataKey::Paused)
        .unwrap_or(false)
}

pub fn set_paused(env: &Env, paused: bool) -> Result<(), PolarisError> {
    let admin = get_admin(env)?;
    admin.require_auth();

    env.storage().instance().set(&DataKey::Paused, &paused);
    extend_instance_ttl(env);
    Ok(())
}

pub fn get_keeper_fee_bps(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::KeeperFeeBps)
        .unwrap_or(100) // Default 1% (100 bps)
}

pub fn set_keeper_fee_bps(env: &Env, bps: u32) -> Result<(), PolarisError> {
    let admin = get_admin(env)?;
    admin.require_auth();

    if bps > 1000 {
        return Err(PolarisError::KeeperFeeExceedsLimit);
    }

    env.storage().instance().set(&DataKey::KeeperFeeBps, &bps);
    extend_instance_ttl(env);
    Ok(())
}

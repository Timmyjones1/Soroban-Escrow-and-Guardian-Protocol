use crate::errors::PolarisError;
use crate::events::PolarisEvents;
use crate::storage::{extend_instance_ttl, DataKey};
use soroban_sdk::{Address, Env};

pub fn initialize(env: &Env, admin: &Address) -> Result<(), PolarisError> {
    if env.storage().instance().has(&DataKey::Admin) {
        return Err(PolarisError::AlreadyInitialized);
    }
    admin.require_auth();

    env.storage().instance().set(&DataKey::Admin, admin);
    env.storage().instance().set(&DataKey::Paused, &false);
    env.storage().instance().set(&DataKey::EscrowCounter, &0u64);

    extend_instance_ttl(env);
    PolarisEvents::contract_initialized(env, admin);
    Ok(())
}

pub fn set_paused(env: &Env, paused: bool) -> Result<(), PolarisError> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(PolarisError::NotInitialized)?;
    admin.require_auth();

    env.storage().instance().set(&DataKey::Paused, &paused);
    extend_instance_ttl(env);
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

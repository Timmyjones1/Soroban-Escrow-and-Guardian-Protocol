#![no_std]

pub mod errors;
pub mod events;
pub mod storage;
pub mod types;

#[cfg(test)]
mod test;

use crate::errors::GuardianError;
use crate::events::GuardianEvents;
use crate::storage::{extend_instance_ttl, extend_persistent_ttl, DataKey};
use crate::types::{ArbiterProfile, BreachKind, BreachRecord, EscrowClient};
use soroban_sdk::{contract, contractimpl, token, Address, Env, String, Vec};

#[contract]
pub struct PolarisGuardianContract;

#[contractimpl]
impl PolarisGuardianContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        escrow_contract: Address,
        bounty_token: Address,
        bounty_reward_amount: i128,
    ) -> Result<(), GuardianError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(GuardianError::AlreadyInitialized);
        }

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage()
            .instance()
            .set(&DataKey::EscrowContract, &escrow_contract);
        env.storage()
            .instance()
            .set(&DataKey::BountyToken, &bounty_token);
        env.storage()
            .instance()
            .set(&DataKey::BountyRewardAmount, &bounty_reward_amount);
        env.storage().instance().set(&DataKey::BreachCounter, &0u64);

        let arbiters: Vec<Address> = Vec::new(&env);
        env.storage()
            .instance()
            .set(&DataKey::ArbiterList, &arbiters);

        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn set_escrow_contract(
        env: Env,
        escrow_contract: Address,
    ) -> Result<(), GuardianError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(GuardianError::NotInitialized)?;
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::EscrowContract, &escrow_contract);
        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn set_bounty_params(
        env: Env,
        bounty_token: Address,
        bounty_reward_amount: i128,
    ) -> Result<(), GuardianError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(GuardianError::NotInitialized)?;
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::BountyToken, &bounty_token);
        env.storage()
            .instance()
            .set(&DataKey::BountyRewardAmount, &bounty_reward_amount);
        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn fund_bounty_pool(
        env: Env,
        funder: Address,
        amount: i128,
    ) -> Result<(), GuardianError> {
        funder.require_auth();

        if amount <= 0 {
            return Err(GuardianError::InvalidAmount);
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::BountyToken)
            .ok_or(GuardianError::NotInitialized)?;

        token::Client::new(&env, &token_addr).transfer(
            &funder,
            &env.current_contract_address(),
            &amount,
        );

        GuardianEvents::bounty_pool_funded(&env, &funder, amount);
        Ok(())
    }

    pub fn register_arbiter(
        env: Env,
        arbiter: Address,
        name: String,
        is_multisig: bool,
    ) -> Result<(), GuardianError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(GuardianError::NotInitialized)?;
        admin.require_auth();

        let key = DataKey::Arbiter(arbiter.clone());
        if env.storage().persistent().has(&key) {
            return Err(GuardianError::ArbiterAlreadyRegistered);
        }

        let profile = ArbiterProfile {
            arbiter: arbiter.clone(),
            name,
            is_multisig,
            active: true,
            registered_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&key, &profile);
        extend_persistent_ttl(&env, &key);

        let mut list: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::ArbiterList)
            .unwrap_or(Vec::new(&env));
        list.push_back(arbiter.clone());
        env.storage().instance().set(&DataKey::ArbiterList, &list);
        extend_instance_ttl(&env);

        GuardianEvents::arbiter_registered(&env, &arbiter, is_multisig);
        Ok(())
    }

    pub fn deactivate_arbiter(env: Env, arbiter: Address) -> Result<(), GuardianError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(GuardianError::NotInitialized)?;
        admin.require_auth();

        let key = DataKey::Arbiter(arbiter.clone());
        let mut profile: ArbiterProfile = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(GuardianError::ArbiterNotFound)?;

        profile.active = false;
        env.storage().persistent().set(&key, &profile);
        extend_persistent_ttl(&env, &key);
        Ok(())
    }

    pub fn is_authorized_arbiter(env: Env, arbiter: Address) -> bool {
        let key = DataKey::Arbiter(arbiter);
        if let Some(profile) = env.storage().persistent().get::<DataKey, ArbiterProfile>(&key) {
            profile.active
        } else {
            false
        }
    }

    pub fn get_arbiter(env: Env, arbiter: Address) -> Result<ArbiterProfile, GuardianError> {
        let key = DataKey::Arbiter(arbiter);
        let profile: ArbiterProfile = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(GuardianError::ArbiterNotFound)?;
        extend_persistent_ttl(&env, &key);
        Ok(profile)
    }

    pub fn trigger_timeout_action(
        env: Env,
        caller: Address,
        job_id: u64,
        milestone_id: u32,
        action_kind: u32,
    ) -> Result<u64, GuardianError> {
        let paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        if paused {
            return Err(GuardianError::ContractPaused);
        }

        caller.require_auth();

        let escrow_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::EscrowContract)
            .ok_or(GuardianError::NotInitialized)?;

        let escrow_client = EscrowClient::new(&env, &escrow_addr);
        let job = escrow_client.get_job(&job_id);

        let (breach_kind, entitled_party) = match action_kind {
            0 => {
                // Claim Review Timeout (entitled party is freelancer)
                escrow_client.claim_review_timeout_keeper(&job_id, &milestone_id, &caller);
                (BreachKind::ReviewTimeoutExpired, job.freelancer.clone())
            }
            1 => {
                // Refund Missed Deadline (entitled party is client)
                escrow_client.refund_deadline_missed(&job_id, &milestone_id);
                (BreachKind::DeadlineMissed, job.client.clone())
            }
            _ => return Err(GuardianError::InvalidActionKind),
        };

        // Pay keeper micro-bounty from guardian bounty pool if available
        let bounty_token: Address = env
            .storage()
            .instance()
            .get(&DataKey::BountyToken)
            .ok_or(GuardianError::NotInitialized)?;
        let bounty_amount: i128 = env
            .storage()
            .instance()
            .get(&DataKey::BountyRewardAmount)
            .unwrap_or(0);

        let mut bounty_paid: i128 = 0;
        if bounty_amount > 0 {
            let bounty_client = token::Client::new(&env, &bounty_token);
            let contract_bal = bounty_client.balance(&env.current_contract_address());
            if contract_bal >= bounty_amount {
                bounty_client.transfer(&env.current_contract_address(), &caller, &bounty_amount);
                bounty_paid = bounty_amount;
            }
        }

        // Record breach in timeline
        let current_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::BreachCounter)
            .unwrap_or(0u64);
        let breach_id = current_id + 1;
        env.storage()
            .instance()
            .set(&DataKey::BreachCounter, &breach_id);
        extend_instance_ttl(&env);

        let record = BreachRecord {
            breach_id,
            job_id,
            milestone_id,
            breach_kind: breach_kind.clone(),
            entitled_party: entitled_party.clone(),
            recorded_at: env.ledger().timestamp(),
            reporter: caller.clone(),
            bounty_paid,
        };

        let key = DataKey::Breach(breach_id);
        env.storage().persistent().set(&key, &record);
        extend_persistent_ttl(&env, &key);

        GuardianEvents::milestone_breached(
            &env,
            job_id,
            milestone_id,
            &breach_kind,
            &entitled_party,
            &caller,
            bounty_paid,
        );

        Ok(breach_id)
    }

    pub fn get_breach(env: Env, breach_id: u64) -> Result<BreachRecord, GuardianError> {
        let key = DataKey::Breach(breach_id);
        let rec: BreachRecord = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(GuardianError::BreachNotFound)?;
        extend_persistent_ttl(&env, &key);
        Ok(rec)
    }

    pub fn get_total_breaches(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::BreachCounter)
            .unwrap_or(0u64)
    }

    pub fn get_bounty_balance(env: Env) -> i128 {
        if let Some(token_addr) = env.storage().instance().get::<DataKey, Address>(&DataKey::BountyToken) {
            token::Client::new(&env, &token_addr).balance(&env.current_contract_address())
        } else {
            0
        }
    }

    pub fn get_admin(env: Env) -> Result<Address, GuardianError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(GuardianError::NotInitialized)
    }

    pub fn set_paused(env: Env, paused: bool) -> Result<(), GuardianError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(GuardianError::NotInitialized)?;
        admin.require_auth();

        env.storage().instance().set(&DataKey::Paused, &paused);
        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn is_paused(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }
}

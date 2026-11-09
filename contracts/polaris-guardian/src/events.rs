use crate::types::BreachKind;
use soroban_sdk::{symbol_short, Address, Env};

pub struct GuardianEvents;

impl GuardianEvents {
    pub fn milestone_breached(
        env: &Env,
        job_id: u64,
        milestone_id: u32,
        breach_kind: &BreachKind,
        entitled_party: &Address,
        reporter: &Address,
        bounty_paid: i128,
    ) {
        env.events().publish(
            (symbol_short!("breached"), job_id, milestone_id),
            (
                breach_kind.clone(),
                entitled_party.clone(),
                reporter.clone(),
                bounty_paid,
            ),
        );
    }

    pub fn arbiter_registered(env: &Env, arbiter: &Address, is_multisig: bool) {
        env.events()
            .publish((symbol_short!("arb_reg"), arbiter.clone()), is_multisig);
    }

    pub fn bounty_pool_funded(env: &Env, funder: &Address, amount: i128) {
        env.events()
            .publish((symbol_short!("bounty_in"), funder.clone()), amount);
    }
}

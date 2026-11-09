use soroban_sdk::{symbol_short, Address, Env, String};

pub struct PolarisEvents;

impl PolarisEvents {
    pub fn contract_initialized(env: &Env, admin: &Address) {
        env.events()
            .publish((symbol_short!("init"), admin.clone()), admin.clone());
    }

    pub fn escrow_created(
        env: &Env,
        escrow_id: u64,
        client: &Address,
        contractor: &Address,
        token: &Address,
        total_amount: i128,
    ) {
        env.events().publish(
            (symbol_short!("esc_new"), escrow_id, client.clone()),
            (contractor.clone(), token.clone(), total_amount),
        );
    }

    pub fn milestone_submitted(
        env: &Env,
        escrow_id: u64,
        milestone_index: u32,
        proof_hash: &String,
    ) {
        env.events().publish(
            (symbol_short!("m_sub"), escrow_id, milestone_index),
            proof_hash.clone(),
        );
    }

    pub fn milestone_approved(
        env: &Env,
        escrow_id: u64,
        milestone_index: u32,
        amount: i128,
        recipient: &Address,
    ) {
        env.events().publish(
            (symbol_short!("m_appr"), escrow_id, milestone_index),
            (amount, recipient.clone()),
        );
    }

    pub fn dispute_raised(env: &Env, escrow_id: u64, initiator: &Address, reason: &String) {
        env.events().publish(
            (symbol_short!("disp_op"), escrow_id, initiator.clone()),
            reason.clone(),
        );
    }

    pub fn dispute_resolved(
        env: &Env,
        escrow_id: u64,
        arbiter: &Address,
        client_payout: i128,
        contractor_payout: i128,
    ) {
        env.events().publish(
            (symbol_short!("disp_res"), escrow_id, arbiter.clone()),
            (client_payout, contractor_payout),
        );
    }

    pub fn timeout_refunded(env: &Env, escrow_id: u64, client: &Address, amount: i128) {
        env.events()
            .publish((symbol_short!("refund"), escrow_id, client.clone()), amount);
    }
}

use soroban_sdk::{symbol_short, Address, BytesN, Env, String, Symbol};

pub struct PolarisEvents;

impl PolarisEvents {
    pub fn contract_initialized(env: &Env, admin: &Address, keeper_fee_bps: u32) {
        env.events()
            .publish((symbol_short!("init"), admin.clone()), keeper_fee_bps);
    }

    pub fn job_created(
        env: &Env,
        job_id: u64,
        client: &Address,
        freelancer: &Address,
        token: &Address,
        total_amount: i128,
    ) {
        env.events().publish(
            (symbol_short!("job_new"), job_id, client.clone()),
            (freelancer.clone(), token.clone(), total_amount),
        );
    }

    pub fn delivery_submitted(
        env: &Env,
        job_id: u64,
        milestone_id: u32,
        delivery_cid: &BytesN<32>,
        delivery_uri: &String,
    ) {
        env.events().publish(
            (symbol_short!("m_deliv"), job_id, milestone_id),
            (delivery_cid.clone(), delivery_uri.clone()),
        );
    }

    pub fn milestone_approved(
        env: &Env,
        job_id: u64,
        milestone_id: u32,
        amount: i128,
        client: &Address,
    ) {
        env.events().publish(
            (symbol_short!("m_appr"), job_id, milestone_id),
            (amount, client.clone()),
        );
    }

    pub fn review_timeout_claimed(
        env: &Env,
        job_id: u64,
        milestone_id: u32,
        amount: i128,
        caller: &Address,
        bounty: i128,
    ) {
        env.events().publish(
            (symbol_short!("m_claim"), job_id, milestone_id),
            (amount, caller.clone(), bounty),
        );
    }

    pub fn deadline_refunded(
        env: &Env,
        job_id: u64,
        milestone_id: u32,
        amount: i128,
        client: &Address,
    ) {
        env.events().publish(
            (symbol_short!("refund"), job_id, milestone_id),
            (amount, client.clone()),
        );
    }

    pub fn dispute_raised(
        env: &Env,
        job_id: u64,
        milestone_id: u32,
        initiator: &Address,
        reason: &String,
    ) {
        env.events().publish(
            (symbol_short!("disp_op"), job_id, milestone_id),
            (initiator.clone(), reason.clone()),
        );
    }

    pub fn dispute_resolved(
        env: &Env,
        job_id: u64,
        milestone_id: u32,
        arbiter: &Address,
        client_payout: i128,
        freelancer_payout: i128,
    ) {
        env.events().publish(
            (symbol_short!("disp_res"), job_id, milestone_id),
            (arbiter.clone(), client_payout, freelancer_payout),
        );
    }

    pub fn milestone_breached(
        env: &Env,
        job_id: u64,
        milestone_id: u32,
        breach_kind: Symbol,
        entitled_party: &Address,
    ) {
        env.events().publish(
            (symbol_short!("breach"), job_id, milestone_id),
            (breach_kind, entitled_party.clone()),
        );
    }
}

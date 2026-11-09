#![cfg(test)]

use crate::{
    types::{MilestoneInput, MilestoneStatus, EscrowStatus},
    PolarisEscrowContract, PolarisEscrowContractClient,
};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, String, Vec,
};

pub struct TestEnv<'a> {
    pub env: Env,
    pub contract_id: Address,
    pub client: PolarisEscrowContractClient<'a>,
    pub token_address: Address,
    pub token_client: token::Client<'a>,
    pub admin: Address,
    pub employer: Address,
    pub contractor: Address,
    pub arbiter: Address,
}

impl<'a> TestEnv<'a> {
    pub fn setup() -> Self {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let employer = Address::generate(&env);
        let contractor = Address::generate(&env);
        let arbiter = Address::generate(&env);

        let contract_id = env.register_contract(None, PolarisEscrowContract);
        let client = PolarisEscrowContractClient::new(&env, &contract_id);

        let token_admin = Address::generate(&env);
        let token_address = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
        let token_client = token::Client::new(&env, &token_address);
        let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

        // Mint 100,000 USDC (in 7 decimals: 100,000_0000000)
        token_admin_client.mint(&employer, &100_000_0000000);

        client.initialize(&admin);

        TestEnv {
            env,
            contract_id,
            client,
            token_address,
            token_client,
            admin,
            employer,
            contractor,
            arbiter,
        }
    }
}

#[test]
fn test_initialize_and_admin() {
    let t = TestEnv::setup();
    assert_eq!(t.client.get_admin(), t.admin);
    assert_eq!(t.client.is_paused(), false);
    assert_eq!(t.client.get_escrow_count(), 0);

    t.client.set_paused(&true);
    assert_eq!(t.client.is_paused(), true);
    t.client.set_paused(&false);
    assert_eq!(t.client.is_paused(), false);
}

#[test]
fn test_create_and_complete_escrow_lifecycle() {
    let t = TestEnv::setup();

    let mut milestones = Vec::new(&t.env);
    milestones.push_back(MilestoneInput {
        description: String::from_str(&t.env, "Phase 1: Architecture & Smart Contracts"),
        amount: 3_000_0000000,
        deadline: 1000,
    });
    milestones.push_back(MilestoneInput {
        description: String::from_str(&t.env, "Phase 2: Frontend & Indexer Integration"),
        amount: 2_000_0000000,
        deadline: 2000,
    });

    let title = String::from_str(&t.env, "Stellar PolarisPay Core Build");

    let escrow_id = t.client.create_escrow(
        &t.employer,
        &t.contractor,
        &t.arbiter,
        &t.token_address,
        &title,
        &milestones,
    );

    assert_eq!(escrow_id, 1);
    assert_eq!(t.client.get_escrow_count(), 1);

    // Verify employer balance deducted and contract funded
    assert_eq!(t.token_client.balance(&t.contract_id), 5_000_0000000);
    assert_eq!(t.token_client.balance(&t.employer), 95_000_0000000);

    let escrow = t.client.get_escrow(&escrow_id);
    assert_eq!(escrow.total_amount, 5_000_0000000);
    assert_eq!(escrow.remaining_balance, 5_000_0000000);
    assert_eq!(escrow.released_amount, 0);
    assert_eq!(escrow.status, EscrowStatus::Active);

    // Contractor submits milestone 0
    let proof_hash = String::from_str(&t.env, "ipfs://bafybeicontracts-v1");
    t.client.submit_milestone(&t.contractor, &escrow_id, &0, &proof_hash);

    let escrow_after_sub = t.client.get_escrow(&escrow_id);
    assert_eq!(escrow_after_sub.milestones.get(0).unwrap().status, MilestoneStatus::Submitted);

    // Employer approves milestone 0
    t.client.approve_milestone(&t.employer, &escrow_id, &0);

    // Verify contractor received payment
    assert_eq!(t.token_client.balance(&t.contractor), 3_000_0000000);
    assert_eq!(t.token_client.balance(&t.contract_id), 2_000_0000000);

    let escrow_after_m0 = t.client.get_escrow(&escrow_id);
    assert_eq!(escrow_after_m0.remaining_balance, 2_000_0000000);
    assert_eq!(escrow_after_m0.released_amount, 3_000_0000000);
    assert_eq!(escrow_after_m0.status, EscrowStatus::Active);

    // Contractor submits and employer approves milestone 1
    let proof_2 = String::from_str(&t.env, "ipfs://bafybeifrontend-v1");
    t.client.submit_milestone(&t.contractor, &escrow_id, &1, &proof_2);
    t.client.approve_milestone(&t.employer, &escrow_id, &1);

    // Verify final state
    assert_eq!(t.token_client.balance(&t.contractor), 5_000_0000000);
    assert_eq!(t.token_client.balance(&t.contract_id), 0);

    let final_escrow = t.client.get_escrow(&escrow_id);
    assert_eq!(final_escrow.remaining_balance, 0);
    assert_eq!(final_escrow.released_amount, 5_000_0000000);
    assert_eq!(final_escrow.status, EscrowStatus::Completed);
}

#[test]
fn test_dispute_resolution_workflow() {
    let t = TestEnv::setup();

    let mut milestones = Vec::new(&t.env);
    milestones.push_back(MilestoneInput {
        description: String::from_str(&t.env, "Full Project Milestone"),
        amount: 4_000_0000000,
        deadline: 5000,
    });

    let title = String::from_str(&t.env, "Dispute Resolution Test");
    let escrow_id = t.client.create_escrow(
        &t.employer,
        &t.contractor,
        &t.arbiter,
        &t.token_address,
        &title,
        &milestones,
    );

    // Employer raises dispute
    let reason = String::from_str(&t.env, "Milestone specifications were not met");
    t.client.raise_dispute(&t.employer, &escrow_id, &reason);

    let escrow = t.client.get_escrow(&escrow_id);
    assert_eq!(escrow.status, EscrowStatus::Disputed);

    // Arbiter inspects and resolves dispute: 50/50 split (2,000 to client, 2,000 to contractor)
    t.client.resolve_dispute(&t.arbiter, &escrow_id, &2_000_0000000, &2_000_0000000);

    assert_eq!(t.token_client.balance(&t.contractor), 2_000_0000000);
    assert_eq!(t.token_client.balance(&t.employer), 98_000_0000000); // 96k remaining + 2k returned
    assert_eq!(t.token_client.balance(&t.contract_id), 0);

    let final_escrow = t.client.get_escrow(&escrow_id);
    assert_eq!(final_escrow.status, EscrowStatus::Completed);
    assert_eq!(final_escrow.remaining_balance, 0);
}

#[test]
fn test_timeout_refund_after_deadline() {
    let t = TestEnv::setup();

    let mut milestones = Vec::new(&t.env);
    milestones.push_back(MilestoneInput {
        description: String::from_str(&t.env, "Urgent Audit Milestone"),
        amount: 1_500_0000000,
        deadline: 500, // Deadline at timestamp 500
    });

    let title = String::from_str(&t.env, "Timeout Test");
    let escrow_id = t.client.create_escrow(
        &t.employer,
        &t.contractor,
        &t.arbiter,
        &t.token_address,
        &title,
        &milestones,
    );

    // Warp ledger time past deadline
    t.env.ledger().set_timestamp(600);

    // Employer claims timeout refund
    t.client.claim_timeout_refund(&t.employer, &escrow_id);

    // Employer should have entire 100,000 USDC back
    assert_eq!(t.token_client.balance(&t.employer), 100_000_0000000);
    assert_eq!(t.token_client.balance(&t.contract_id), 0);

    let escrow = t.client.get_escrow(&escrow_id);
    assert_eq!(escrow.status, EscrowStatus::Refunded);
    assert_eq!(escrow.remaining_balance, 0);
}

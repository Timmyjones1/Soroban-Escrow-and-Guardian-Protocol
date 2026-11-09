#![cfg(test)]

use crate::types::{EscrowStatus, Milestone, PayeeSplit};
use crate::{PolarisEscrowContract, PolarisEscrowContractClient};
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{token, Address, BytesN, Env, String, Vec};

fn create_token_contract<'a>(
    env: &Env,
    admin: &Address,
) -> (Address, token::Client<'a>, token::StellarAssetClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_addr = sac.address();
    (
        token_addr.clone(),
        token::Client::new(env, &token_addr),
        token::StellarAssetClient::new(env, &token_addr),
    )
}

fn setup_test<'a>(
    env: &'a Env,
) -> (
    PolarisEscrowContractClient<'a>,
    Address,
    Address,
    Address,
    Address,
    token::Client<'a>,
    token::StellarAssetClient<'a>,
    Address,
) {
    env.mock_all_auths();

    let admin = Address::generate(env);
    let client = Address::generate(env);
    let freelancer = Address::generate(env);
    let arbiter = Address::generate(env);

    let (token_addr, token_client, sac_client) = create_token_contract(env, &admin);

    let contract_id = env.register_contract(None, PolarisEscrowContract);
    let escrow_client = PolarisEscrowContractClient::new(env, &contract_id);

    // Initialize with 200 bps (2%) keeper fee
    escrow_client.initialize(&admin, &200);

    // Fund client account
    sac_client.mint(&client, &10_000_000);

    (
        escrow_client,
        admin,
        client,
        freelancer,
        arbiter,
        token_client,
        sac_client,
        token_addr,
    )
}

#[test]
fn test_initialize_and_admin() {
    let env = Env::default();
    let (escrow_client, admin, _, _, _, _, _, _) = setup_test(&env);

    assert_eq!(escrow_client.get_admin(), admin);
    assert_eq!(escrow_client.get_keeper_fee_bps(), 200);
    assert!(!escrow_client.is_paused());

    // Update keeper fee
    escrow_client.set_keeper_fee_bps(&300);
    assert_eq!(escrow_client.get_keeper_fee_bps(), 300);

    // Toggle pause
    escrow_client.set_paused(&true);
    assert!(escrow_client.is_paused());
    escrow_client.set_paused(&false);
    assert!(!escrow_client.is_paused());
}

#[test]
fn test_happy_path_multi_milestone_and_split_distribution() {
    let env = Env::default();
    let (escrow_client, _, client, freelancer, arbiter, token_client, _, token_addr) =
        setup_test(&env);

    let agency = Address::generate(&env);
    let platform = Address::generate(&env);

    // Dynamic splits: 70% Freelancer, 20% Agency, 10% Platform fee (Total = 10,000 bps)
    let mut splits: Vec<PayeeSplit> = Vec::new(&env);
    splits.push_back(PayeeSplit {
        payee: freelancer.clone(),
        bps: 7000,
    });
    splits.push_back(PayeeSplit {
        payee: agency.clone(),
        bps: 2000,
    });
    splits.push_back(PayeeSplit {
        payee: platform.clone(),
        bps: 1000,
    });

    let dummy_cid = BytesN::from_array(&env, &[1u8; 32]);
    let empty_cid = BytesN::from_array(&env, &[0u8; 32]);
    let now = 1_000_000u64;
    env.ledger().set_timestamp(now);

    let mut milestones: Vec<Milestone> = Vec::new(&env);
    milestones.push_back(Milestone {
        id: 1,
        description: String::from_str(&env, "Architecture & Smart Contracts"),
        amount: 6_000_000,
        deliver_by: now + 86400,
        review_window: 14400,
        delivered_at: 0,
        delivery_cid: empty_cid.clone(),
        delivery_uri: String::from_str(&env, ""),
        status: EscrowStatus::Funded,
    });
    milestones.push_back(Milestone {
        id: 2,
        description: String::from_str(&env, "Frontend & Testing"),
        amount: 4_000_000,
        deliver_by: now + 172800,
        review_window: 14400,
        delivered_at: 0,
        delivery_cid: empty_cid,
        delivery_uri: String::from_str(&env, ""),
        status: EscrowStatus::Funded,
    });

    let job_id = escrow_client.create_job(
        &client,
        &freelancer,
        &Some(arbiter),
        &token_addr,
        &milestones,
        &splits,
    );

    assert_eq!(job_id, 1);
    assert_eq!(token_client.balance(&client), 0); // 10M transferred

    // Freelancer submits milestone 1 delivery
    escrow_client.submit_delivery(
        &job_id,
        &1,
        &dummy_cid,
        &String::from_str(&env, "ipfs://QmDummyHash1"),
    );

    let job_after_delivery = escrow_client.get_job(&job_id);
    let m1 = job_after_delivery.milestones.get(0).unwrap();
    assert_eq!(m1.status, EscrowStatus::Delivered);
    assert_eq!(m1.delivered_at, now);

    // Client approves milestone 1 (6,000,000 tokens)
    escrow_client.approve_milestone(&job_id, &1);

    // Check split distributions:
    // 70% of 6M = 4,200,000
    // 20% of 6M = 1,200,000
    // 10% of 6M = 600,000
    assert_eq!(token_client.balance(&freelancer), 4_200_000);
    assert_eq!(token_client.balance(&agency), 1_200_000);
    assert_eq!(token_client.balance(&platform), 600_000);

    let job_after_approval = escrow_client.get_job(&job_id);
    assert_eq!(
        job_after_approval.milestones.get(0).unwrap().status,
        EscrowStatus::Completed
    );
}

#[test]
fn test_silent_client_timeout_resolution_freelancer_and_keeper() {
    let env = Env::default();
    let (escrow_client, _, client, freelancer, arbiter, token_client, _, token_addr) =
        setup_test(&env);

    let keeper = Address::generate(&env);

    let mut splits: Vec<PayeeSplit> = Vec::new(&env);
    splits.push_back(PayeeSplit {
        payee: freelancer.clone(),
        bps: 10_000,
    });

    let empty_cid = BytesN::from_array(&env, &[0u8; 32]);
    let dummy_cid = BytesN::from_array(&env, &[9u8; 32]);
    let now = 2_000_000u64;
    env.ledger().set_timestamp(now);

    let mut milestones: Vec<Milestone> = Vec::new(&env);
    milestones.push_back(Milestone {
        id: 1,
        description: String::from_str(&env, "Silent Client Test"),
        amount: 5_000_000,
        deliver_by: now + 50000,
        review_window: 10000,
        delivered_at: 0,
        delivery_cid: empty_cid,
        delivery_uri: String::from_str(&env, ""),
        status: EscrowStatus::Funded,
    });

    let job_id = escrow_client.create_job(
        &client,
        &freelancer,
        &Some(arbiter),
        &token_addr,
        &milestones,
        &splits,
    );

    // Freelancer delivers at t = 2,000,000
    escrow_client.submit_delivery(
        &job_id,
        &1,
        &dummy_cid,
        &String::from_str(&env, "ipfs://deliverable"),
    );

    // Attempt claim before review window elapses -> fails
    env.ledger().set_timestamp(now + 5000);
    let premature = escrow_client.try_claim_review_timeout(&job_id, &1);
    assert!(premature.is_err());

    // Advance time past review window: now + 10,001 seconds
    env.ledger().set_timestamp(now + 10001);

    // Keeper triggers claim_review_timeout_keeper
    // Keeper fee is 200 bps (2%) of 5,000,000 = 100,000
    // Freelancer gets 4,900,000
    escrow_client.claim_review_timeout_keeper(&job_id, &1, &keeper);

    assert_eq!(token_client.balance(&keeper), 100_000);
    assert_eq!(token_client.balance(&freelancer), 4_900_000);

    let job = escrow_client.get_job(&job_id);
    assert_eq!(
        job.milestones.get(0).unwrap().status,
        EscrowStatus::Completed
    );
}

#[test]
fn test_missed_deadline_refund_to_client() {
    let env = Env::default();
    let (escrow_client, _, client, freelancer, arbiter, token_client, _, token_addr) =
        setup_test(&env);

    let mut splits: Vec<PayeeSplit> = Vec::new(&env);
    splits.push_back(PayeeSplit {
        payee: freelancer.clone(),
        bps: 10_000,
    });

    let empty_cid = BytesN::from_array(&env, &[0u8; 32]);
    let now = 3_000_000u64;
    env.ledger().set_timestamp(now);

    let deliver_by = now + 1000;
    let mut milestones: Vec<Milestone> = Vec::new(&env);
    milestones.push_back(Milestone {
        id: 1,
        description: String::from_str(&env, "Missed Milestone"),
        amount: 8_000_000,
        deliver_by,
        review_window: 5000,
        delivered_at: 0,
        delivery_cid: empty_cid,
        delivery_uri: String::from_str(&env, ""),
        status: EscrowStatus::Funded,
    });

    let job_id = escrow_client.create_job(
        &client,
        &freelancer,
        &Some(arbiter),
        &token_addr,
        &milestones,
        &splits,
    );

    // Client spent 8M out of 10M, balance = 2M
    assert_eq!(token_client.balance(&client), 2_000_000);

    // Trying refund before deadline fails
    env.ledger().set_timestamp(now + 500);
    let early_refund = escrow_client.try_refund_deadline_missed(&job_id, &1);
    assert!(early_refund.is_err());

    // Advance past delivery deadline without freelancer delivery
    env.ledger().set_timestamp(deliver_by + 1);

    // Keeper or client triggers refund
    escrow_client.refund_deadline_missed(&job_id, &1);

    // Client refunded 8M, total back to 10M!
    assert_eq!(token_client.balance(&client), 10_000_000);

    let job = escrow_client.get_job(&job_id);
    assert_eq!(
        job.milestones.get(0).unwrap().status,
        EscrowStatus::Refunded
    );
}

#[test]
fn test_dispute_lifecycle_and_arbiter_resolution() {
    let env = Env::default();
    let (escrow_client, _, client, freelancer, arbiter, token_client, _, token_addr) =
        setup_test(&env);

    let mut splits: Vec<PayeeSplit> = Vec::new(&env);
    splits.push_back(PayeeSplit {
        payee: freelancer.clone(),
        bps: 10_000,
    });

    let empty_cid = BytesN::from_array(&env, &[0u8; 32]);
    let dummy_cid = BytesN::from_array(&env, &[7u8; 32]);
    let now = 4_000_000u64;
    env.ledger().set_timestamp(now);

    let mut milestones: Vec<Milestone> = Vec::new(&env);
    milestones.push_back(Milestone {
        id: 1,
        description: String::from_str(&env, "Disputed Deliverable"),
        amount: 10_000_000,
        deliver_by: now + 50000,
        review_window: 10000,
        delivered_at: 0,
        delivery_cid: empty_cid,
        delivery_uri: String::from_str(&env, ""),
        status: EscrowStatus::Funded,
    });

    let job_id = escrow_client.create_job(
        &client,
        &freelancer,
        &Some(arbiter),
        &token_addr,
        &milestones,
        &splits,
    );

    // Freelancer submits delivery
    escrow_client.submit_delivery(
        &job_id,
        &1,
        &dummy_cid,
        &String::from_str(&env, "ipfs://work"),
    );

    // Client raises dispute: deliverable does not match specifications
    escrow_client.raise_dispute(
        &client,
        &job_id,
        &1,
        &String::from_str(&env, "Work is incomplete and buggy"),
    );

    let job_disputed = escrow_client.get_job(&job_id);
    assert_eq!(
        job_disputed.milestones.get(0).unwrap().status,
        EscrowStatus::Disputed
    );

    // Arbiter resolves dispute with 40% client refund, 60% freelancer payout (4M / 6M)
    escrow_client.resolve_dispute(&job_id, &1, &4_000_000, &6_000_000);

    assert_eq!(token_client.balance(&client), 4_000_000);
    assert_eq!(token_client.balance(&freelancer), 6_000_000);

    let job_resolved = escrow_client.get_job(&job_id);
    assert_eq!(
        job_resolved.milestones.get(0).unwrap().status,
        EscrowStatus::Resolved
    );

    let dispute_rec = escrow_client.get_dispute(&job_id, &1);
    assert_eq!(dispute_rec.client_payout, 4_000_000);
    assert_eq!(dispute_rec.freelancer_payout, 6_000_000);
}

#[test]
fn test_multi_payee_split_math_zero_loss() {
    let env = Env::default();
    let (escrow_client, _, client, freelancer, arbiter, token_client, _, token_addr) =
        setup_test(&env);

    let party_a = Address::generate(&env);
    let party_b = Address::generate(&env);
    let party_c = Address::generate(&env);

    // Three-way split: 3333 bps (33.33%), 3333 bps (33.33%), 3334 bps (33.34%) -> Sum = 10,000 bps
    let mut splits: Vec<PayeeSplit> = Vec::new(&env);
    splits.push_back(PayeeSplit {
        payee: party_a.clone(),
        bps: 3333,
    });
    splits.push_back(PayeeSplit {
        payee: party_b.clone(),
        bps: 3333,
    });
    splits.push_back(PayeeSplit {
        payee: party_c.clone(),
        bps: 3334,
    });

    let empty_cid = BytesN::from_array(&env, &[0u8; 32]);
    let dummy_cid = BytesN::from_array(&env, &[5u8; 32]);
    let now = 5_000_000u64;
    env.ledger().set_timestamp(now);

    let amount = 1_000_007i128; // Prime number amount to test division precision!
    let mut milestones: Vec<Milestone> = Vec::new(&env);
    milestones.push_back(Milestone {
        id: 1,
        description: String::from_str(&env, "Precision Math Check"),
        amount,
        deliver_by: now + 50000,
        review_window: 10000,
        delivered_at: 0,
        delivery_cid: empty_cid,
        delivery_uri: String::from_str(&env, ""),
        status: EscrowStatus::Funded,
    });

    let job_id = escrow_client.create_job(
        &client,
        &freelancer,
        &Some(arbiter),
        &token_addr,
        &milestones,
        &splits,
    );

    escrow_client.submit_delivery(
        &job_id,
        &1,
        &dummy_cid,
        &String::from_str(&env, "ipfs://proof"),
    );

    escrow_client.approve_milestone(&job_id, &1);

    let bal_a = token_client.balance(&party_a);
    let bal_b = token_client.balance(&party_b);
    let bal_c = token_client.balance(&party_c);

    // Invariant: sum of distributed amounts MUST exactly match milestone amount! Zero loss of tokens!
    assert_eq!(bal_a + bal_b + bal_c, amount);
}

#[test]
fn test_unauthorized_caller_rejections() {
    let env = Env::default();
    let (escrow_client, _, client, freelancer, arbiter, _, _, token_addr) = setup_test(&env);

    let hacker = Address::generate(&env);

    let mut splits: Vec<PayeeSplit> = Vec::new(&env);
    splits.push_back(PayeeSplit {
        payee: freelancer.clone(),
        bps: 10_000,
    });

    let empty_cid = BytesN::from_array(&env, &[0u8; 32]);
    let now = 6_000_000u64;
    env.ledger().set_timestamp(now);

    let mut milestones: Vec<Milestone> = Vec::new(&env);
    milestones.push_back(Milestone {
        id: 1,
        description: String::from_str(&env, "Security Check"),
        amount: 1_000_000,
        deliver_by: now + 10000,
        review_window: 5000,
        delivered_at: 0,
        delivery_cid: empty_cid,
        delivery_uri: String::from_str(&env, ""),
        status: EscrowStatus::Funded,
    });

    let job_id = escrow_client.create_job(
        &client,
        &freelancer,
        &Some(arbiter),
        &token_addr,
        &milestones,
        &splits,
    );

    // Unauthorized party cannot raise dispute
    let unauth_dispute = escrow_client.try_raise_dispute(
        &hacker,
        &job_id,
        &1,
        &String::from_str(&env, "I want free tokens"),
    );
    assert!(unauth_dispute.is_err());
}

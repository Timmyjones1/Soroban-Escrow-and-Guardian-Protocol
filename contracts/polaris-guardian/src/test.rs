#![cfg(test)]

use crate::types::{BreachKind, EscrowStatus, Job, Milestone, PayeeSplit};
use crate::{PolarisGuardianContract, PolarisGuardianContractClient};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{contract, contractimpl, token, Address, BytesN, Env, String, Vec};

#[contract]
pub struct MockEscrowContract;

#[contractimpl]
impl MockEscrowContract {
    pub fn claim_review_timeout_keeper(
        _env: Env,
        _job_id: u64,
        _milestone_id: u32,
        _keeper: Address,
    ) {
    }

    pub fn refund_deadline_missed(_env: Env, _job_id: u64, _milestone_id: u32) {}

    pub fn get_job(env: Env, job_id: u64) -> Job {
        let client = Address::generate(&env);
        let freelancer = Address::generate(&env);
        let token = Address::generate(&env);

        let mut milestones = Vec::new(&env);
        milestones.push_back(Milestone {
            id: 1,
            description: String::from_str(&env, "Test Milestone"),
            amount: 1_000_000,
            deliver_by: 2_000_000,
            review_window: 10_000,
            delivered_at: 1_000_000,
            delivery_cid: BytesN::from_array(&env, &[1u8; 32]),
            delivery_uri: String::from_str(&env, "ipfs://test"),
            status: EscrowStatus::Funded,
        });

        let mut splits = Vec::new(&env);
        splits.push_back(PayeeSplit {
            payee: freelancer.clone(),
            bps: 10_000,
        });

        Job {
            job_id,
            client,
            freelancer,
            arbiter: None,
            token,
            total_amount: 1_000_000,
            milestones,
            splits,
            current_milestone: 0,
        }
    }
}

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

fn setup_guardian_test<'a>(
    env: &'a Env,
) -> (
    PolarisGuardianContractClient<'a>,
    Address,
    Address,
    Address,
    token::Client<'a>,
    token::StellarAssetClient<'a>,
    Address,
) {
    env.mock_all_auths();

    let admin = Address::generate(env);
    let arbiter = Address::generate(env);
    let (token_addr, token_client, sac_client) = create_token_contract(env, &admin);

    // Deploy Mock Escrow Contract
    let mock_escrow_id = env.register_contract(None, MockEscrowContract);

    // Deploy Guardian Contract
    let guardian_id = env.register_contract(None, PolarisGuardianContract);
    let guardian_client = PolarisGuardianContractClient::new(env, &guardian_id);

    // Initialize Guardian with 50_000 micro-bounty
    guardian_client.initialize(&admin, &mock_escrow_id, &token_addr, &50_000);

    // Fund admin and fund bounty pool with 500,000 tokens
    sac_client.mint(&admin, &1_000_000);
    guardian_client.fund_bounty_pool(&admin, &500_000);

    (
        guardian_client,
        admin,
        arbiter,
        mock_escrow_id,
        token_client,
        sac_client,
        token_addr,
    )
}

#[test]
fn test_guardian_initialization_and_arbiter_registration() {
    let env = Env::default();
    let (guardian, admin, arbiter, _, _, _, _) = setup_guardian_test(&env);

    assert_eq!(guardian.get_admin(), admin);
    assert_eq!(guardian.get_bounty_balance(), 500_000);
    assert!(!guardian.is_paused());

    // Register Arbiter
    guardian.register_arbiter(
        &arbiter,
        &String::from_str(&env, "Stellar Arbitration DAO"),
        &true,
    );

    assert!(guardian.is_authorized_arbiter(&arbiter));
    let profile = guardian.get_arbiter(&arbiter);
    assert_eq!(
        profile.name,
        String::from_str(&env, "Stellar Arbitration DAO")
    );
    assert!(profile.is_multisig);
    assert!(profile.active);

    // Deactivate arbiter
    guardian.deactivate_arbiter(&arbiter);
    assert!(!guardian.is_authorized_arbiter(&arbiter));
}

#[test]
fn test_guardian_trigger_timeout_action_review_timeout() {
    let env = Env::default();
    let (guardian, _, _, _, token_client, _, _) = setup_guardian_test(&env);

    let keeper = Address::generate(&env);
    let job_id = 42u64;

    assert_eq!(token_client.balance(&keeper), 0);

    // Trigger review timeout action (action_kind = 0)
    let breach_id = guardian.trigger_timeout_action(&keeper, &job_id, &1, &0);
    assert_eq!(breach_id, 1);

    // Keeper received micro-bounty of 50_000 from Guardian bounty pool!
    assert_eq!(token_client.balance(&keeper), 50_000);

    let breach = guardian.get_breach(&breach_id);
    assert_eq!(breach.job_id, job_id);
    assert_eq!(breach.milestone_id, 1);
    assert_eq!(breach.breach_kind, BreachKind::ReviewTimeoutExpired);
    assert_eq!(breach.reporter, keeper);
    assert_eq!(breach.bounty_paid, 50_000);
}

#[test]
fn test_guardian_trigger_timeout_action_missed_deadline() {
    let env = Env::default();
    let (guardian, _, _, _, token_client, _, _) = setup_guardian_test(&env);

    let keeper = Address::generate(&env);
    let job_id = 99u64;

    // Trigger deadline missed action (action_kind = 1)
    let breach_id = guardian.trigger_timeout_action(&keeper, &job_id, &1, &1);
    assert_eq!(breach_id, 1);

    // Keeper received micro-bounty of 50_000 from Guardian bounty pool!
    assert_eq!(token_client.balance(&keeper), 50_000);

    let breach = guardian.get_breach(&breach_id);
    assert_eq!(breach.breach_kind, BreachKind::DeadlineMissed);
    assert_eq!(breach.bounty_paid, 50_000);
}

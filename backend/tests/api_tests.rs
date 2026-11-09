use polaris_backend::store::{EscrowModel, EscrowStatus, EscrowStore, MilestoneModel, MilestoneStatus};

#[tokio::test]
async fn test_store_escrow_insertion_and_query() {
    let store = EscrowStore::new();

    let escrow = EscrowModel {
        id: 1,
        client: "GBTESTCLIENTXXXXXXXXXXXXX".to_string(),
        contractor: "GBTESTCONTRACTORXXXXXXXXX".to_string(),
        arbiter: "GBTESTARBITERXXXXXXXXXXXX".to_string(),
        token: "CBTESTUSDCXXXXXXXXXXXXXXX".to_string(),
        total_amount: 5000_0000000,
        remaining_balance: 5000_0000000,
        released_amount: 0,
        status: EscrowStatus::Active,
        milestones: vec![MilestoneModel {
            index: 0,
            description: "Phase 1 Deliverable".to_string(),
            amount: 5000_0000000,
            deadline: 1800000000,
            status: MilestoneStatus::Pending,
            proof_hash: "".to_string(),
            submitted_at: 0,
            approved_at: 0,
        }],
        created_at: 1730000000,
        title: "Test Escrow Agreement".to_string(),
    };

    store.insert_escrow(escrow.clone()).await;

    let fetched = store.get_escrow(1).await;
    assert!(fetched.is_some());
    let e = fetched.unwrap();
    assert_eq!(e.title, "Test Escrow Agreement");
    assert_eq!(e.total_amount, 5000_0000000);

    // Update milestone
    let updated = store
        .update_milestone_status(1, 0, MilestoneStatus::Submitted, Some("ipfs://hash123".to_string()))
        .await;
    assert!(updated);

    let updated_escrow = store.get_escrow(1).await.unwrap();
    assert_eq!(
        updated_escrow.milestones[0].status,
        MilestoneStatus::Submitted
    );
    assert_eq!(updated_escrow.milestones[0].proof_hash, "ipfs://hash123");
}

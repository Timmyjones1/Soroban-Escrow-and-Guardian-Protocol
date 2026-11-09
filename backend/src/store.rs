use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EscrowStatus {
    Active,
    Disputed,
    Completed,
    Refunded,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum MilestoneStatus {
    Pending,
    Submitted,
    Approved,
    Refunded,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MilestoneModel {
    pub index: u32,
    pub description: String,
    pub amount: i128,
    pub deadline: u64,
    pub status: MilestoneStatus,
    pub proof_hash: String,
    pub submitted_at: u64,
    pub approved_at: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EscrowModel {
    pub id: u64,
    pub client: String,
    pub contractor: String,
    pub arbiter: String,
    pub token: String,
    pub total_amount: i128,
    pub remaining_balance: i128,
    pub released_amount: i128,
    pub status: EscrowStatus,
    pub milestones: Vec<MilestoneModel>,
    pub created_at: u64,
    pub title: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DisputeModel {
    pub escrow_id: u64,
    pub initiator: String,
    pub reason: String,
    pub raised_at: u64,
    pub resolved_at: u64,
    pub client_payout: i128,
    pub contractor_payout: i128,
}

#[derive(Clone, Default)]
pub struct EscrowStore {
    escrows: Arc<RwLock<HashMap<u64, EscrowModel>>>,
    disputes: Arc<RwLock<HashMap<u64, DisputeModel>>>,
}

impl EscrowStore {
    pub fn new() -> Self {
        Self::default()
    }

    pub async fn insert_escrow(&self, escrow: EscrowModel) {
        let mut map = self.escrows.write().await;
        map.insert(escrow.id, escrow);
    }

    pub async fn get_escrow(&self, id: u64) -> Option<EscrowModel> {
        let map = self.escrows.read().await;
        map.get(&id).cloned()
    }

    pub async fn list_escrows(&self) -> Vec<EscrowModel> {
        let map = self.escrows.read().await;
        let mut list: Vec<EscrowModel> = map.values().cloned().collect();
        list.sort_by_key(|e| e.id);
        list
    }

    pub async fn update_milestone_status(
        &self,
        escrow_id: u64,
        milestone_index: u32,
        status: MilestoneStatus,
        proof_hash: Option<String>,
    ) -> bool {
        let mut map = self.escrows.write().await;
        if let Some(escrow) = map.get_mut(&escrow_id) {
            for m in &mut escrow.milestones {
                if m.index == milestone_index {
                    m.status = status;
                    if let Some(hash) = proof_hash {
                        m.proof_hash = hash;
                    }
                    return true;
                }
            }
        }
        false
    }

    pub async fn record_dispute(&self, dispute: DisputeModel) {
        let mut map = self.disputes.write().await;
        map.insert(dispute.escrow_id, dispute);
    }

    pub async fn get_dispute(&self, escrow_id: u64) -> Option<DisputeModel> {
        let map = self.disputes.read().await;
        map.get(&escrow_id).cloned()
    }
}

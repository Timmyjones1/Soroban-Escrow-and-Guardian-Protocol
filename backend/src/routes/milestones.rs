use crate::store::{EscrowStore, MilestoneStatus};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use serde_json::json;

#[derive(Deserialize)]
pub struct UpdateMilestonePayload {
    pub status: MilestoneStatus,
    pub proof_hash: Option<String>,
}

pub async fn list_milestones(
    State(store): State<EscrowStore>,
    Path(id): Path<u64>,
) -> impl IntoResponse {
    match store.get_escrow(id).await {
        Some(escrow) => (
            StatusCode::OK,
            Json(json!({ "status": "success", "data": escrow.milestones })),
        ),
        None => (
            StatusCode::NOT_FOUND,
            Json(json!({ "status": "error", "message": "Escrow not found" })),
        ),
    }
}

pub async fn update_milestone(
    State(store): State<EscrowStore>,
    Path((id, index)): Path<(u64, u32)>,
    Json(payload): Json<UpdateMilestonePayload>,
) -> impl IntoResponse {
    let success = store
        .update_milestone_status(id, index, payload.status, payload.proof_hash)
        .await;

    if success {
        (
            StatusCode::OK,
            Json(json!({ "status": "success", "message": "Milestone updated successfully" })),
        )
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(json!({ "status": "error", "message": "Escrow or milestone not found" })),
        )
    }
}

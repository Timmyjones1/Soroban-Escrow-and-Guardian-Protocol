use crate::store::{EscrowModel, EscrowStore};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde_json::json;

pub async fn list_escrows(State(store): State<EscrowStore>) -> impl IntoResponse {
    let list = store.list_escrows().await;
    Json(json!({
        "status": "success",
        "data": list,
        "count": list.len()
    }))
}

pub async fn get_escrow(
    State(store): State<EscrowStore>,
    Path(id): Path<u64>,
) -> impl IntoResponse {
    match store.get_escrow(id).await {
        Some(escrow) => (StatusCode::OK, Json(json!({ "status": "success", "data": escrow }))),
        None => (
            StatusCode::NOT_FOUND,
            Json(json!({ "status": "error", "message": format!("Escrow with ID {} not found", id) })),
        ),
    }
}

pub async fn create_escrow_record(
    State(store): State<EscrowStore>,
    Json(payload): Json<EscrowModel>,
) -> impl IntoResponse {
    let id = payload.id;
    store.insert_escrow(payload).await;
    (
        StatusCode::CREATED,
        Json(json!({ "status": "success", "message": "Escrow recorded successfully", "id": id })),
    )
}

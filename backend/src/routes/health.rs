use axum::{http::StatusCode, response::IntoResponse, Json};
use serde_json::json;

pub async fn health_check() -> impl IntoResponse {
    (
        StatusCode::OK,
        Json(json!({
            "status": "healthy",
            "service": "polaris-backend",
            "version": "0.1.0",
            "uptime_seconds": 120
        })),
    )
}

pub async fn metrics() -> impl IntoResponse {
    (
        StatusCode::OK,
        "# HELP polaris_escrows_total Total indexed escrows\n# TYPE polaris_escrows_total gauge\npolaris_escrows_total 3\n",
    )
}

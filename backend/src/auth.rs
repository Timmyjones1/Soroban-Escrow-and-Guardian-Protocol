use axum::{
    extract::Query,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Deserialize)]
pub struct ChallengeQuery {
    pub account: String,
}

#[derive(Serialize)]
pub struct ChallengeResponse {
    pub transaction: String,
    pub network_passphrase: String,
}

pub async fn generate_sep10_challenge(
    Query(query): Query<ChallengeQuery>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    if query.account.len() != 56 || !query.account.starts_with('G') {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Invalid Stellar public key" })),
        ));
    }

    // In a production server, this signs a valid Stellar challenge transaction
    let mock_challenge_xdr = format!(
        "AAAAAgAAAACtestnetChallengeForAccount_{}_PolarisPayAuthTokenNonce",
        query.account
    );

    Ok(Json(json!({
        "status": "success",
        "challenge_xdr": mock_challenge_xdr,
        "network_passphrase": "Test SDF Network ; September 2015"
    })))
}

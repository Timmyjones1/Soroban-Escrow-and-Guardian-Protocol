use axum::{extract::Query, http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Deserialize)]
pub struct OffRampQuoteQuery {
    pub source_asset: String,  // e.g. "USDC"
    pub dest_currency: String, // e.g. "NGN", "BRL", "KES", "EUR"
    pub amount: f64,
}

#[derive(Serialize)]
pub struct AnchorQuote {
    pub anchor_domain: String,
    pub source_asset: String,
    pub dest_currency: String,
    pub source_amount: f64,
    pub dest_amount: f64,
    pub exchange_rate: f64,
    pub estimated_fee_usd: f64,
    pub eta_seconds: u32,
    pub sep24_interactive_url: String,
}

pub async fn get_offramp_quote(
    Query(query): Query<OffRampQuoteQuery>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    if query.amount <= 0.0 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Amount must be greater than zero" })),
        ));
    }

    let (rate, domain) = match query.dest_currency.to_uppercase().as_str() {
        "NGN" => (1650.0, "cowrie.exchange"),
        "BRL" => (5.85, "anclap.com"),
        "KES" => (130.0, "clickpesa.com"),
        "EUR" => (0.92, "tempo.eu.com"),
        _ => (1.0, "anchor.stellar.org"),
    };

    let fee = 0.50; // flat 50 cents fee
    let net_amount = (query.amount - fee).max(0.0);
    let dest_amount = net_amount * rate;

    let quote = AnchorQuote {
        anchor_domain: domain.to_string(),
        source_asset: query.source_asset,
        dest_currency: query.dest_currency.to_uppercase(),
        source_amount: query.amount,
        dest_amount,
        exchange_rate: rate,
        estimated_fee_usd: fee,
        eta_seconds: 15,
        sep24_interactive_url: format!(
            "https://{}/sep24/interactive?asset=USDC&amount={}",
            domain, query.amount
        ),
    };

    Ok(Json(json!({ "status": "success", "quote": quote })))
}

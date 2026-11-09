pub mod auth;
pub mod config;
pub mod indexer;
pub mod rpc_client;
pub mod routes;
pub mod store;

use crate::config::AppConfig;
use crate::indexer::EventIndexer;
use crate::rpc_client::SorobanRpcClient;
use crate::store::EscrowStore;
use axum::{
    routing::{get, patch},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter("info,polaris_backend=debug")
        .init();

    let config = AppConfig::from_env();
    info!("Initializing Stellar PolarisPay Backend with config: {:?}", config);

    let store = EscrowStore::new();
    let rpc_client = SorobanRpcClient::new(config.rpc_url.clone());

    // Start background event indexer
    let indexer = Arc::new(EventIndexer::new(
        rpc_client.clone(),
        store.clone(),
        config.contract_id.clone(),
    ));
    indexer.start();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(routes::health::health_check))
        .route("/metrics", get(routes::health::metrics))
        .route("/auth/challenge", get(auth::generate_sep10_challenge))
        .route("/api/v1/escrows", get(routes::escrows::list_escrows).post(routes::escrows::create_escrow_record))
        .route("/api/v1/escrows/:id", get(routes::escrows::get_escrow))
        .route("/api/v1/escrows/:id/milestones", get(routes::milestones::list_milestones))
        .route("/api/v1/escrows/:id/milestones/:index", patch(routes::milestones::update_milestone))
        .route("/api/v1/anchors/quote", get(routes::anchors::get_offramp_quote))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(store);

    let addr: SocketAddr = format!("{}:{}", config.host, config.port).parse()?;
    info!("PolarisPay backend listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

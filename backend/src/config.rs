use std::env;

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub port: u16,
    pub host: String,
    pub rpc_url: String,
    pub contract_id: String,
    pub network_passphrase: String,
}

impl AppConfig {
    pub fn from_env() -> Self {
        Self {
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .unwrap_or(8080),
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            rpc_url: env::var("STELLAR_RPC_URL")
                .unwrap_or_else(|_| "https://soroban-testnet.stellar.org".to_string()),
            contract_id: env::var("POLARIS_CONTRACT_ID")
                .unwrap_or_else(|_| "CCXP7XZN4VGLPYGAK32A32WGL34B4O7M7I4Z2KOD7P6M3WGLUHQPOLAR".to_string()),
            network_passphrase: env::var("STELLAR_NETWORK_PASSPHRASE")
                .unwrap_or_else(|_| "Test SDF Network ; September 2015".to_string()),
        }
    }
}

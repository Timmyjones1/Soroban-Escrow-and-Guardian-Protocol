use crate::rpc_client::SorobanRpcClient;
use crate::store::EscrowStore;
use std::sync::Arc;
use tokio::time::{sleep, Duration};
use tracing::{error, info};

pub struct EventIndexer {
    rpc_client: SorobanRpcClient,
    pub store: EscrowStore,
    contract_id: String,
}

impl EventIndexer {
    pub fn new(rpc_client: SorobanRpcClient, store: EscrowStore, contract_id: String) -> Self {
        Self {
            rpc_client,
            store,
            contract_id,
        }
    }

    pub fn start(self: Arc<Self>) {
        tokio::spawn(async move {
            info!(
                contract_id = %self.contract_id,
                "Starting background Soroban RPC event indexer..."
            );

            let mut start_ledger: u32 = 1;
            loop {
                match self
                    .rpc_client
                    .get_events(start_ledger, std::slice::from_ref(&self.contract_id))
                    .await
                {
                    Ok(events) => {
                        for ev in events {
                            info!(event_id = %ev.id, ledger = %ev.ledger, "Processed Soroban contract event");
                            if ev.ledger as u32 >= start_ledger {
                                start_ledger = ev.ledger as u32 + 1;
                            }
                        }
                    }
                    Err(e) => {
                        error!(error = %e, "Indexer poll encountered error, retrying in 5s");
                    }
                }
                sleep(Duration::from_secs(5)).await;
            }
        });
    }
}

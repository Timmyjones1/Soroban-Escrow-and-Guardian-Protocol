use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RpcEventResponse {
    pub id: String,
    pub paging_token: Option<String>,
    pub topic: Vec<String>,
    pub value: serde_json::Value,
    pub ledger: u64,
}

#[derive(Clone, Debug)]
pub struct SorobanRpcClient {
    client: Client,
    rpc_url: String,
}

impl SorobanRpcClient {
    pub fn new(rpc_url: String) -> Self {
        Self {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(10))
                .build()
                .unwrap_or_default(),
            rpc_url,
        }
    }

    pub async fn get_health(&self) -> Result<bool> {
        let payload = json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getHealth"
        });

        let resp = self
            .client
            .post(&self.rpc_url)
            .json(&payload)
            .send()
            .await
            .context("Failed to send getHealth request")?;

        let res_json: serde_json::Value = resp.json().await?;
        let status = res_json["result"]["status"]
            .as_str()
            .unwrap_or("")
            .to_string();
        Ok(status == "healthy")
    }

    pub async fn get_events(
        &self,
        start_ledger: u32,
        contract_ids: &[String],
    ) -> Result<Vec<RpcEventResponse>> {
        let payload = json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getEvents",
            "params": {
                "startLedger": start_ledger,
                "filters": [{
                    "type": "contract",
                    "contractIds": contract_ids
                }],
                "limit": 100
            }
        });

        let resp = self
            .client
            .post(&self.rpc_url)
            .json(&payload)
            .send()
            .await
            .context("Failed to query getEvents from Soroban RPC")?;

        let res_json: serde_json::Value = resp.json().await?;
        if let Some(events_arr) = res_json["result"]["events"].as_array() {
            let mut parsed = Vec::new();
            for item in events_arr {
                let event: RpcEventResponse =
                    serde_json::from_value(item.clone()).unwrap_or_else(|_| RpcEventResponse {
                        id: item["id"].as_str().unwrap_or("").to_string(),
                        paging_token: item["pagingToken"].as_str().map(|s| s.to_string()),
                        topic: vec![],
                        value: item["value"].clone(),
                        ledger: item["ledger"].as_u64().unwrap_or(0),
                    });
                parsed.push(event);
            }
            Ok(parsed)
        } else {
            Ok(vec![])
        }
    }
}

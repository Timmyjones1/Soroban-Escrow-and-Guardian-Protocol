#!/usr/bin/env bash
# Deploys PolarisPay Escrow contract and initializes state on Stellar
set -euo pipefail
source "$(dirname "$0")/config.sh"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WASM_PATH="$ROOT_DIR/target/wasm32-unknown-unknown/release/polaris_escrow.wasm"

if [ ! -f "$WASM_PATH" ]; then
    echo "Contract WASM not found. Building now..."
    "$ROOT_DIR/scripts/build-contracts.sh"
fi

ADMIN_ADDR=$(stellar keys address polaris-admin)
echo "Deploying PolarisPay contract with admin: $ADMIN_ADDR on $STELLAR_NETWORK..."

CONTRACT_ID=$(stellar contract deploy \
    --wasm "$WASM_PATH" \
    --source polaris-admin \
    --network "$STELLAR_NETWORK")

echo "Contract deployed with ID: $CONTRACT_ID"

echo "Initializing PolarisPay contract..."
stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source polaris-admin \
    --network "$STELLAR_NETWORK" \
    -- initialize \
    --admin "$ADMIN_ADDR"

echo "Contract initialized successfully!"

# Save deployment manifest
MANIFEST="$ROOT_DIR/scripts/deployed-contracts.json"
cat <<EOF > "$MANIFEST"
{
  "network": "$STELLAR_NETWORK",
  "contract_id": "$CONTRACT_ID",
  "admin": "$ADMIN_ADDR",
  "deployed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "wasm_hash": "$(sha256sum "$WASM_PATH" | awk '{print $1}')"
}
EOF

echo "Saved deployment manifest to: $MANIFEST"

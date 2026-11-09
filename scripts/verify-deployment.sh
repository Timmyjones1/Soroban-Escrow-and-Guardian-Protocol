#!/usr/bin/env bash
# Verifies on-chain state and contract accessibility on Stellar Testnet
set -euo pipefail
source "$(dirname "$0")/config.sh"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT_DIR/scripts/deployed-contracts.json"

if [ ! -f "$MANIFEST" ]; then
    echo "Manifest $MANIFEST does not exist." >&2
    exit 1
fi

CONTRACT_ID=$(jq -r '.contract_id' "$MANIFEST")
echo "Verifying contract $CONTRACT_ID on $STELLAR_NETWORK..."

ADMIN=$(stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source polaris-admin \
    --network "$STELLAR_NETWORK" \
    -- get_admin)

echo "On-chain admin confirmed: $ADMIN"

PAUSED=$(stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source polaris-admin \
    --network "$STELLAR_NETWORK" \
    -- is_paused)

echo "Contract paused state: $PAUSED"
echo "Deployment verified successfully on Stellar Testnet!"

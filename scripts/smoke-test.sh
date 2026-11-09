#!/usr/bin/env bash
# Smoke test validating contract query endpoints without altering state
set -euo pipefail
source "$(dirname "$0")/config.sh"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT_DIR/scripts/deployed-contracts.json"
CONTRACT_ID=$(jq -r '.contract_id' "$MANIFEST")

echo "Running smoke test on PolarisPay contract: $CONTRACT_ID"
COUNT=$(stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source polaris-admin \
    --network "$STELLAR_NETWORK" \
    -- get_escrow_count)

echo "Smoke test passed! Escrow count = $COUNT"

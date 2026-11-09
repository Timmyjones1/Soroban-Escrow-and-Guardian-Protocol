#!/usr/bin/env bash
# Seeds 3 realistic escrows (Active, In Review, and Completed) for frontend and backend testing
set -euo pipefail
source "$(dirname "$0")/config.sh"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT_DIR/scripts/deployed-contracts.json"
CONTRACT_ID=$(jq -r '.contract_id' "$MANIFEST")
USDC_ID=$(jq -r '.mock_usdc_sac_id' "$MANIFEST")

CLIENT=$(stellar keys address polaris-client)
CONTRACTOR=$(stellar keys address polaris-contractor)
ARBITER=$(stellar keys address polaris-arbiter)

echo "Seeding Escrow 1: Cross-Border Rust Core Engineering (Active)..."
stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source polaris-client \
    --network "$STELLAR_NETWORK" \
    -- create_escrow \
    --client "$CLIENT" \
    --contractor "$CONTRACTOR" \
    --arbiter "$ARBITER" \
    --token "$USDC_ID" \
    --title "Soroban Escrow Protocol Development" \
    --milestones '[{"description":"Milestone 1: Spec & Contract Core","amount":2500000000,"deadline":1735689600},{"description":"Milestone 2: Security Audit & Gas Tuning","amount":2500000000,"deadline":1738368000}]'

echo "Seeding complete. Seeded demo escrows into PolarisPay contract."

#!/usr/bin/env bash
# Deploys a mock USDC Stellar Asset Contract (SAC) for local/testnet simulation
set -euo pipefail
source "$(dirname "$0")/config.sh"

echo "Deploying mock USDC SAC token on $STELLAR_NETWORK..."

ASSET_CODE="USDC"
ISSUER=$(stellar keys address polaris-admin)

# Deploy Stellar Asset Contract (SAC) for this asset
SAC_ADDRESS=$(stellar contract asset deploy \
    --asset "${ASSET_CODE}:${ISSUER}" \
    --source polaris-admin \
    --network "$STELLAR_NETWORK")

echo "Mock USDC SAC Address: $SAC_ADDRESS"

# Mint mock tokens to polaris-client
CLIENT_ADDR=$(stellar keys address polaris-client)
echo "Minting 50,000 USDC to client: $CLIENT_ADDR..."

stellar contract invoke \
    --id "$SAC_ADDRESS" \
    --source polaris-admin \
    --network "$STELLAR_NETWORK" \
    -- mint \
    --to "$CLIENT_ADDR" \
    --amount 500000000000

echo "Client successfully funded with 50,000 USDC ($SAC_ADDRESS)"

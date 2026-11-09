#!/usr/bin/env bash
# Generates and funds local/testnet Stellar identities via Stellar CLI
set -euo pipefail
source "$(dirname "$0")/config.sh"

ROLES=("polaris-admin" "polaris-client" "polaris-contractor" "polaris-arbiter")

for ROLE in "${ROLES[@]}"; do
    echo "Checking identity: $ROLE"
    if ! stellar keys address "$ROLE" &>/dev/null; then
        echo "Generating keypair for $ROLE..."
        stellar keys generate "$ROLE" --network "$STELLAR_NETWORK"
    fi

    ADDR=$(stellar keys address "$ROLE")
    echo "Identity $ROLE address: $ADDR"

    if [ "$STELLAR_NETWORK" = "testnet" ] || [ "$STELLAR_NETWORK" = "local" ]; then
        echo "Funding $ROLE with Friendbot..."
        stellar keys fund "$ROLE" --network "$STELLAR_NETWORK" || true
    fi
done

echo "All PolarisPay identities successfully generated and funded."

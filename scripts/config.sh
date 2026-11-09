#!/usr/bin/env bash
# Stellar PolarisPay Network Configuration
set -euo pipefail

export STELLAR_NETWORK="${STELLAR_NETWORK:-testnet}"

if [ "$STELLAR_NETWORK" = "testnet" ]; then
    export STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
    export STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
    export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
    export FRIENDBOT_URL="https://friendbot.stellar.org"
elif [ "$STELLAR_NETWORK" = "local" ]; then
    export STELLAR_RPC_URL="http://localhost:8000/soroban/rpc"
    export STELLAR_HORIZON_URL="http://localhost:8000"
    export STELLAR_NETWORK_PASSPHRASE="Standalone Network ; February 2022"
    export FRIENDBOT_URL="http://localhost:8000/friendbot"
else
    echo "Unknown network: $STELLAR_NETWORK" >&2
    exit 1
fi

echo "Configured for Stellar network: $STELLAR_NETWORK ($STELLAR_RPC_URL)"

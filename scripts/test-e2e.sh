#!/usr/bin/env bash
# End-to-end CLI workflow test for Stellar PolarisPay
set -euo pipefail
source "$(dirname "$0")/config.sh"

echo "=== Running PolarisPay End-to-End Simulation ==="

# 1. Setup Identities
"$ROOT_DIR/scripts/setup-identities.sh"

# 2. Build WASM
"$ROOT_DIR/scripts/build-contracts.sh"

# 3. Deploy SAC & Contracts
"$ROOT_DIR/scripts/deploy-mock-usdc.sh"
"$ROOT_DIR/scripts/deploy.sh"

# 4. Verify deployment
"$ROOT_DIR/scripts/verify-deployment.sh"

echo "=== All E2E On-Chain Workflow Tests Succeeded! ==="

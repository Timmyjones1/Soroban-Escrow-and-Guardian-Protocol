#!/usr/bin/env bash
# Builds and optimizes Soroban contract WASM bytecode
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Building contracts for target wasm32-unknown-unknown..."
stellar contract build

WASM_FILE="target/wasm32-unknown-unknown/release/polaris_escrow.wasm"
if [ -f "$WASM_FILE" ]; then
    SIZE=$(wc -c < "$WASM_FILE")
    echo "Optimized WASM built successfully: $WASM_FILE ($SIZE bytes)"
else
    echo "Build failed: $WASM_FILE not found" >&2
    exit 1
fi

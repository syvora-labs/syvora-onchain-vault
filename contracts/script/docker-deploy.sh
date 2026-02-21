#!/bin/sh
# ──────────────────────────────────────────────────────────────────────────────
# docker-deploy.sh — runs inside the deployer container
#
# 1. Installs Solidity dependencies if not already present
# 2. Deploys SyvoraToken + Vault to the local Anvil node
# 3. Writes web/.env.local with the deployed addresses so Vite picks them up
# ──────────────────────────────────────────────────────────────────────────────
set -e

RPC_URL="${RPC_URL:-http://anvil:8545}"

# Anvil's deterministic account #0 — always the same, safe for local testing only
SENDER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

echo "=== Installing dependencies (if needed) ==="
if [ ! -d "lib/forge-std" ]; then
  forge install --no-git
fi

echo "=== Deploying contracts to $RPC_URL ==="
OUTPUT=$(forge script script/Deploy.s.sol \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --sender "$SENDER" \
  --private-key "$PRIVATE_KEY" 2>&1)

echo "$OUTPUT"

# Parse addresses from the deploy script's console.log output
TOKEN=$(echo "$OUTPUT" | grep "SyvoraToken:" | grep -oE '0x[0-9a-fA-F]{40}' | head -1)
VAULT=$(echo "$OUTPUT"  | grep "Vault:"       | grep -oE '0x[0-9a-fA-F]{40}' | head -1)

if [ -z "$TOKEN" ] || [ -z "$VAULT" ]; then
  echo "ERROR: could not parse deployed addresses — check forge output above"
  exit 1
fi

echo ""
echo "=== Writing web/.env.local ==="
echo "  VITE_TOKEN_ADDRESS=$TOKEN"
echo "  VITE_VAULT_ADDRESS=$VAULT"
echo "  VITE_CHAIN_ID=31337"

cat > /app/web/.env.local << EOF
VITE_TOKEN_ADDRESS=$TOKEN
VITE_VAULT_ADDRESS=$VAULT
VITE_CHAIN_ID=31337
EOF

echo "=== Done ==="

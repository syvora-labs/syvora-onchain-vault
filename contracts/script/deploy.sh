#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# deploy.sh — deploy SyvoraToken + Vault to Sepolia and patch the frontend
#
# Usage (from the repo root):
#   bash contracts/script/deploy.sh [--dry-run]
#
# Options:
#   --dry-run   Simulate locally without sending transactions (no --broadcast)
#
# Prerequisites:
#   1. Foundry installed  (foundryup)
#   2. .env file present at the repo root  (copy from .env.example and fill in)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Resolve paths ─────────────────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTRACTS_DIR="$REPO_ROOT/contracts"
ENV_FILE="$REPO_ROOT/.env"
ADDRESSES_FILE="$REPO_ROOT/web/src/contracts/addresses.ts"

# ── Load .env ─────────────────────────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found."
  echo "       Copy .env.example to .env and fill in your values."
  exit 1
fi
# Export all variables from .env (ignore comments and blank lines)
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# ── Flags ─────────────────────────────────────────────────────────────────────
DRY_RUN=false
for arg in "$@"; do
  [[ "$arg" == "--dry-run" ]] && DRY_RUN=true
done

# ── Build broadcast flags ─────────────────────────────────────────────────────
FORGE_FLAGS="--rpc-url sepolia"
if [[ "$DRY_RUN" == "true" ]]; then
  echo "=== DRY RUN — no transactions will be sent ==="
else
  FORGE_FLAGS="$FORGE_FLAGS --broadcast --verify"
fi

# ── Run deploy script ─────────────────────────────────────────────────────────
echo "=== Running Forge deploy script ==="
cd "$CONTRACTS_DIR"

# Capture the full output and also stream it to the terminal
OUTPUT=$(forge script script/Deploy.s.sol $FORGE_FLAGS 2>&1 | tee /dev/tty)

# ── Skip address patching on dry-run ─────────────────────────────────────────
if [[ "$DRY_RUN" == "true" ]]; then
  echo ""
  echo "=== Dry run complete. Re-run without --dry-run to broadcast. ==="
  exit 0
fi

# ── Extract deployed addresses from forge output ──────────────────────────────
# The deploy script prints lines like:
#   SyvoraToken:        0xAbc...
#   Vault:              0xDef...
TOKEN_ADDR=$(echo "$OUTPUT" | grep -i "SyvoraToken:" | grep -oE '0x[0-9a-fA-F]{40}' | head -1)
VAULT_ADDR=$(echo "$OUTPUT"  | grep -i "Vault:"       | grep -oE '0x[0-9a-fA-F]{40}' | head -1)

if [[ -z "$TOKEN_ADDR" || -z "$VAULT_ADDR" ]]; then
  echo ""
  echo "WARNING: Could not extract addresses from forge output."
  echo "         Please update $ADDRESSES_FILE manually."
  exit 1
fi

echo ""
echo "=== Deployed addresses ==="
echo "  SyvoraToken: $TOKEN_ADDR"
echo "  Vault:       $VAULT_ADDR"

# ── Patch web/src/contracts/addresses.ts ─────────────────────────────────────
# Replace the placeholder zero addresses with the real ones.
sed -i '' \
  "s|syvoraToken: '0x0\+',|syvoraToken: '$TOKEN_ADDR',|" \
  "$ADDRESSES_FILE"

sed -i '' \
  "s|vault:       '0x0\+',|vault:       '$VAULT_ADDR',|" \
  "$ADDRESSES_FILE"

echo ""
echo "=== addresses.ts updated ==="
echo "  $ADDRESSES_FILE"
echo ""
echo "Next steps:"
echo "  1. Verify the addresses look correct in addresses.ts"
echo "  2. Run: cd web && npm run dev"
echo "  3. Make sure MetaMask is on Sepolia and fund your wallet with test ETH"
echo "     Faucets: https://sepoliafaucet.com  |  https://faucet.quicknode.com/ethereum/sepolia"

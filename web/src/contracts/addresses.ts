/**
 * Contract addresses and network config.
 *
 * Values are read from Vite env vars so the same build works for both
 * local Anvil and Sepolia without editing source code.
 *
 * For local Docker:  written automatically by contracts/script/docker-deploy.sh
 * For Sepolia:       written automatically by contracts/script/deploy.sh
 * For manual setup:  create web/.env.local and add:
 *
 *   VITE_TOKEN_ADDRESS=0x...
 *   VITE_VAULT_ADDRESS=0x...
 *   VITE_CHAIN_ID=31337        # 31337 = Anvil local, 11155111 = Sepolia
 */

export const ADDRESSES = {
  syvoraToken: (import.meta.env.VITE_TOKEN_ADDRESS as string) || '0x0000000000000000000000000000000000000000',
  vault:       (import.meta.env.VITE_VAULT_ADDRESS as string) || '0x0000000000000000000000000000000000000000',
}

export const REQUIRED_CHAIN_ID: number = Number(import.meta.env.VITE_CHAIN_ID) || 11155111

export const REQUIRED_NETWORK_NAME = REQUIRED_CHAIN_ID === 31337 ? 'Anvil (local)' : 'Sepolia'

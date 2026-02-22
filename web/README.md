# web/

Vue 3 + TypeScript + Vite frontend for the Syvora Onchain Vault dapp.

## Stack

- [Vue 3](https://vuejs.org/) with `<script setup>` composables
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [ethers.js v6](https://docs.ethers.org/v6/) for MetaMask and contract interaction

## Local development

The easiest way to run the full stack locally is via Docker Compose from the repo root:

```bash
docker compose up --build
```

To run the frontend standalone (requires contracts already deployed and `web/.env.local` present):

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment variables

The frontend reads contract addresses from `web/.env.local` (Vite loads this automatically):

```
VITE_TOKEN_ADDRESS=0x...
VITE_VAULT_ADDRESS=0x...
VITE_CHAIN_ID=31337
```

This file is written automatically by the deploy scripts. See the root [README.md](../README.md).

## Project structure

```
src/
├── contracts/
│   ├── abis.ts           # Human-readable ABIs for ethers.js
│   └── addresses.ts      # Reads addresses from VITE_* env vars
├── composables/
│   ├── useWallet.ts      # MetaMask connection state
│   ├── useContracts.ts   # Typed ethers.js contract instances
│   ├── useToken.ts       # LRN balance
│   └── useVault.ts       # Deposit / withdraw / position
├── components/
│   ├── WalletConnect.vue
│   ├── TokenBalance.vue
│   ├── DepositForm.vue
│   └── VaultPosition.vue
└── views/
    ├── HomeView.vue
    └── ProfileView.vue
```

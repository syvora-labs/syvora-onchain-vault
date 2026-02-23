# 🌿 Syvora Onchain Vault

An Ethereum dapp consisting of three parts:

- **`contracts/`** — a [Foundry](https://book.getfoundry.sh/) project with two Solidity contracts and a full unit test suite
- **`packages/ui/`** — a shared Vue 3 component library used by the frontend
- **`web/`** — a [Vue 3](https://vuejs.org/) + TypeScript + Vite frontend that connects to MetaMask, interacts with the deployed contracts, and includes a community forum backed by [Supabase](https://supabase.com)

### 🌱 What it does

1. **SyvoraToken (LRN)** — a standard ERC-20 token built with OpenZeppelin. The deployer receives 1,000,000 LRN and can mint more.
2. **Vault** — a time-locked vault where users deposit LRN tokens. Deposits are locked for **7 days** before they can be withdrawn.
3. **Forum** — a Twitter-like community feed. Users sign up with email, post short messages (up to 280 characters), and can optionally link their wallet to show their vault balance alongside their posts.

Target network: **Sepolia testnet**

---

## 🌲 Project structure

```
syvora-onchain-vault/
├── docker-compose.yml
├── .dockerignore
├── .env.example                  # required env vars for Sepolia deploy (copy → .env)
├── GETTING_STARTED.md
├── contracts/
│   ├── foundry.toml
│   ├── src/
│   │   ├── SyvoraToken.sol       # ERC-20 token (name: SyvoraToken, symbol: LRN)
│   │   └── Vault.sol             # 7-day time-locked vault
│   ├── test/
│   │   ├── SyvoraToken.t.sol     # 10 unit tests
│   │   └── Vault.t.sol           # 15 unit tests
│   └── script/
│       ├── Deploy.s.sol
│       ├── deploy.sh             # Sepolia: deploy + write web/.env.local
│       └── docker-deploy.sh      # Docker: deploy to Anvil + write web/.env.local
├── packages/
│   └── ui/                       # @syvora/ui — shared component library
│       └── src/
│           ├── components/       # AppShell, SyvoraButton, SyvoraCard, …
│           └── index.ts
├── supabase/
│   └── migrations/
│       └── 20260223193956_forum_schema.sql   # profiles + posts tables + RLS
└── web/
    ├── Dockerfile.dev
    └── src/
        ├── contracts/
        │   ├── abis.ts           # Human-readable ABIs for ethers.js
        │   └── addresses.ts      # Reads addresses from VITE_* env vars
        ├── lib/
        │   └── supabase.ts       # Supabase client singleton
        ├── composables/
        │   ├── useWallet.ts      # MetaMask connection state
        │   ├── useContracts.ts   # Typed ethers.js contract instances
        │   ├── useToken.ts       # LRN balance
        │   ├── useVault.ts       # Deposit / withdraw / position
        │   ├── useAuth.ts        # Supabase auth + profile state
        │   └── useForum.ts       # Posts CRUD + realtime subscription
        ├── views/
        │   ├── HomeView.vue
        │   ├── ProfileView.vue
        │   └── ForumView.vue
        └── components/
            ├── WalletConnect.vue
            ├── TokenBalance.vue
            ├── DepositForm.vue
            ├── VaultPosition.vue
            ├── PostCard.vue      # Forum post with vault balance badge
            └── AuthModal.vue     # Sign in / sign up overlay
```

---

## 🍃 Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| 🐳 [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Local blockchain + deploy + frontend (all-in-one) | Download from Docker |
| 🦊 [MetaMask](https://metamask.io/) | Browser wallet for the frontend | Browser extension |
| 🟦 [Supabase](https://supabase.com) project | Forum backend (auth + database) | Free account at supabase.com |
| ⚒️ [Foundry](https://book.getfoundry.sh/getting-started/installation) | Compile, test, and deploy to Sepolia (optional) | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| 🟢 [Node.js](https://nodejs.org/) v18+ | Run the frontend outside Docker (optional) | Via [nvm](https://github.com/nvm-sh/nvm) or direct download |

---

## 🌊 1. Clone and install dependencies

```bash
git clone --recurse-submodules <your-repo-url>
cd syvora-onchain-vault
```

> If you already cloned without `--recurse-submodules`, run `git submodule update --init --recursive` to pull the Solidity libraries.

**For local testing with Docker** — no further setup needed beyond Supabase credentials. See [GETTING_STARTED.md](GETTING_STARTED.md).

**For Sepolia deploy or running the frontend outside Docker** — install dependencies from the repo root:

```bash
npm install
```

---

## 🧪 2. Run the contract tests locally

No wallet or testnet needed — Foundry spins up an in-memory EVM.

```bash
cd contracts

# Run all tests
forge test

# Run with detailed output (shows gas costs per call)
forge test -v

# Run a specific test file
forge test --match-path test/Vault.t.sol

# Run a specific test by name
forge test --match-test test_WithdrawBeforeLockReverts
```

All 25 tests should pass:

```
Ran 15 tests for test/Vault.t.sol:VaultTest
[PASS] test_DepositEmitsEvent()
[PASS] test_DepositStoresPosition()
...
Suite result: ok. 15 passed; 0 failed

Ran 10 tests for test/SyvoraToken.t.sol:SyvoraTokenTest
[PASS] test_Name()
[PASS] test_OwnerCanMint()
...
Suite result: ok. 10 passed; 0 failed
```

---

## 🗄️ 3. Set up Supabase

Create a free project at [supabase.com](https://supabase.com), then apply the migration to create the forum schema:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This creates the `profiles` and `posts` tables with row-level security policies.

---

## 🚀 4. Deploy to Sepolia

### 4a. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Where to get it |
|----------|----------------|
| `PRIVATE_KEY` | Export from MetaMask → Account Details → Show private key |
| `SEPOLIA_RPC_URL` | Free from [Alchemy](https://alchemy.com) or [Infura](https://infura.io) |
| `ETHERSCAN_API_KEY` | Free from [etherscan.io/myapikey](https://etherscan.io/myapikey) |

> 🔒 **Security:** use a dedicated testnet wallet. Never use a mainnet wallet or commit your `.env`.

### 4b. Get Sepolia test ETH

You need test ETH to pay for gas:
- [sepoliafaucet.com](https://sepoliafaucet.com)
- [faucet.quicknode.com/ethereum/sepolia](https://faucet.quicknode.com/ethereum/sepolia)

### 4c. Dry-run (simulate without sending transactions)

```bash
bash contracts/script/deploy.sh --dry-run
```

### 4d. Deploy

```bash
bash contracts/script/deploy.sh
```

This will:
1. Broadcast the deploy transactions to Sepolia
2. Verify the source code on Etherscan (`--verify`)
3. Automatically write the deployed addresses into `web/.env.local`

---

## 🌿 5. Run the frontend locally

Add your Supabase credentials to `web/.env.local`:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Then start the dev server:

```bash
cd web
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in the browser where MetaMask is installed.

**Frontend walkthrough:**
1. Click **Connect Wallet** — MetaMask will ask for permission
2. Switch MetaMask to the **Sepolia** network if prompted
3. Your LRN token balance appears in the Wallet Balance card
4. Enter an amount and click **Deposit** — two MetaMask signatures are required:
   - First: `approve` (authorises the Vault to pull your tokens)
   - Second: `deposit` (locks the tokens for 7 days)
5. The Vault Position card shows your locked amount and unlock date
6. After 7 days the **Withdraw** button becomes active
7. Visit **/forum** — sign up with an email, post messages, and link your wallet to display your vault balance on your posts

---

## 🌍 Key concepts demonstrated

| Concept | Where |
|---------|-------|
| ERC-20 token with OpenZeppelin | `SyvoraToken.sol` |
| Ownable access control | `SyvoraToken.sol` |
| ERC-20 `approve` + `transferFrom` flow | `Vault.sol` → `deposit()` |
| Time-locking with `block.timestamp` | `Vault.sol` |
| Reentrancy protection | `Vault.sol` + `ReentrancyGuard` |
| Custom Solidity errors | `Vault.sol` |
| Checks-Effects-Interactions pattern | `Vault.sol` → `withdraw()` |
| Foundry cheatcodes (`vm.warp`, `vm.prank`, `vm.expectRevert`, `vm.expectEmit`) | `*.t.sol` |
| ethers.js v6 `BrowserProvider` + `Contract` | `composables/` |
| Vue 3 composables with module-level shared state | `useWallet.ts`, `useAuth.ts` |
| Supabase auth (email/password) | `useAuth.ts` |
| Supabase row-level security | `supabase/migrations/` |
| Supabase realtime subscriptions | `useForum.ts` |
| Read-only contract calls without a signer | `PostCard.vue` |

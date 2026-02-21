# Syvora Onchain Vault

An Ethereum dapp consisting of two parts:

- **`contracts/`** — a [Foundry](https://book.getfoundry.sh/) project with two Solidity contracts and a full unit test suite
- **`web/`** — a [Vue 3](https://vuejs.org/) + TypeScript + Vite frontend that connects to MetaMask and interacts with the deployed contracts

### What it does

1. **SyvoraToken (LRN)** — a standard ERC-20 token built with OpenZeppelin. The deployer receives 1,000,000 LRN and can mint more.
2. **Vault** — a time-locked vault where users deposit LRN tokens. Deposits are locked for **7 days** before they can be withdrawn.

Target network: **Sepolia testnet**

---

## Project structure

```
syvora-onchain-vault/
├── .env.example                  # required environment variables (copy → .env)
├── contracts/
│   ├── foundry.toml              # Foundry config (Solidity version, remappings, RPC)
│   ├── src/
│   │   ├── SyvoraToken.sol       # ERC-20 token (name: SyvoraToken, symbol: LRN)
│   │   └── Vault.sol             # 7-day time-locked vault
│   ├── test/
│   │   ├── SyvoraToken.t.sol     # 10 unit tests
│   │   └── Vault.t.sol           # 15 unit tests
│   └── script/
│       ├── Deploy.s.sol          # Foundry deploy script
│       └── deploy.sh             # Shell helper: deploy + auto-patch frontend addresses
└── web/
    └── src/
        ├── contracts/
        │   ├── abis.ts           # Human-readable ABIs for ethers.js
        │   └── addresses.ts      # Deployed contract addresses (fill after deploy)
        ├── composables/
        │   ├── useWallet.ts      # MetaMask connection state
        │   ├── useContracts.ts   # Typed ethers.js contract instances
        │   ├── useToken.ts       # LRN balance
        │   └── useVault.ts       # Deposit / withdraw / position
        └── components/
            ├── WalletConnect.vue
            ├── TokenBalance.vue
            ├── DepositForm.vue
            └── VaultPosition.vue
```

---

## Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| [Foundry](https://book.getfoundry.sh/getting-started/installation) | Compile, test, and deploy Solidity | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| [Node.js](https://nodejs.org/) v18+ | Run the Vue frontend | Via [nvm](https://github.com/nvm-sh/nvm) or direct download |
| [MetaMask](https://metamask.io/) | Browser wallet for the frontend | Browser extension |

---

## 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd syvora-onchain-vault

# Install Solidity dependencies (forge-std + OpenZeppelin)
cd contracts && forge install && cd ..

# Install frontend dependencies
cd web && npm install && cd ..
```

---

## 2. Run the contract tests locally

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

## 3. Deploy to Sepolia

### 3a. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Where to get it |
|----------|----------------|
| `PRIVATE_KEY` | Export from MetaMask → Account Details → Show private key |
| `DEPLOYER_ADDRESS` | Your wallet address (the one matching the key above) |
| `SEPOLIA_RPC_URL` | Free from [Alchemy](https://alchemy.com) or [Infura](https://infura.io) |
| `ETHERSCAN_API_KEY` | Free from [etherscan.io/myapikey](https://etherscan.io/myapikey) |

> **Security:** use a dedicated testnet wallet. Never use a mainnet wallet or commit your `.env`.

### 3b. Get Sepolia test ETH

You need test ETH to pay for gas:
- [sepoliafaucet.com](https://sepoliafaucet.com)
- [faucet.quicknode.com/ethereum/sepolia](https://faucet.quicknode.com/ethereum/sepolia)

### 3c. Dry-run (simulate without sending transactions)

```bash
bash contracts/script/deploy.sh --dry-run
```

### 3d. Deploy

```bash
bash contracts/script/deploy.sh
```

This will:
1. Broadcast the deploy transactions to Sepolia
2. Verify the source code on Etherscan (`--verify`)
3. Automatically write the deployed addresses into `web/src/contracts/addresses.ts`

You can also run the Forge command directly:

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
```

---

## 4. Run the frontend locally

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

---

## Key concepts demonstrated

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
| Vue 3 composables with module-level shared state | `useWallet.ts` |

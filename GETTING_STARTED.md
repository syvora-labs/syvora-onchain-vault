# Getting Started

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [MetaMask](https://metamask.io/) browser extension

---

## 1. Start everything

No environment variables needed — the Docker setup uses Anvil's built-in test accounts and handles everything automatically.

```bash
docker compose up --build
```

This starts three containers in order:

1. **anvil** — local EVM blockchain on `http://localhost:8545`
2. **deployer** — deploys the contracts and writes addresses to `web/.env.local`
3. **frontend** — Vite dev server on `http://localhost:5173`

Wait until you see `VITE ready` in the logs, then open [http://localhost:5173](http://localhost:5173).

---

## 2. Configure MetaMask (once)

**Add the Anvil network:**
1. MetaMask → Settings → Networks → Add a network manually
2. Fill in:

| Field | Value |
|-------|-------|
| Network name | `Anvil` |
| RPC URL | `http://localhost:8545` |
| Chain ID | `31337` |
| Currency symbol | `ETH` |

**Import a test account:**
1. MetaMask → account menu (top right) → Import account
2. Paste this private key (Anvil account #0, comes with 10,000 fake ETH):
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

> Never use this key on mainnet or put real funds in it.

---

## 3. Connect and test

1. Open [http://localhost:5173](http://localhost:5173)
2. Switch MetaMask to the **Anvil** network
3. Click **Connect Wallet**
4. Deposit LRN tokens into the vault
5. Check your vault position

---

## Run the contract tests

Requires [Foundry](https://book.getfoundry.sh/getting-started/installation) installed locally. Foundry runs tests in an isolated in-memory EVM — no Docker or wallet needed:

```bash
cd contracts && forge test
```

---

## Fast-forwarding the 7-day lock

Requires [Foundry](https://book.getfoundry.sh/getting-started/installation) installed locally (`cast` is part of Foundry).

You don't need to wait 7 days to test withdrawals. Run:

```bash
# Skip forward 7 days + 1 second
cast rpc anvil_increaseTime 604801 --rpc-url http://localhost:8545

# Mine a block so the timestamp takes effect
cast rpc anvil_mine --rpc-url http://localhost:8545
```

Refresh the frontend — the Withdraw button will be active.

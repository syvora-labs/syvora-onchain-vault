# Getting Started

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [MetaMask](https://metamask.io/) browser extension

---

## 1. Add your Supabase credentials

The forum feature requires a [Supabase](https://supabase.com) project. Add these two values to `web/.env.local` (create the file if it doesn't exist yet):

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Find them in your Supabase dashboard under **Project Settings → API**. Everything else is handled automatically.

---

## 2. Start everything

```bash
docker compose up --build
```

This starts three containers in order:

1. **anvil** — local EVM blockchain on `http://localhost:8545`
2. **deployer** — deploys the contracts and writes the contract addresses to `web/.env.local` (your Supabase vars are preserved)
3. **frontend** — Vite dev server on `http://localhost:5173`

Wait until you see `VITE ready` in the logs, then open [http://localhost:5173](http://localhost:5173).

---

## 3. Configure MetaMask (once)

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

## 4. Connect and test

**Vault**
1. Open [http://localhost:5173](http://localhost:5173)
2. Switch MetaMask to the **Anvil** network
3. Click **Connect Wallet**
4. Deposit LRN tokens into the vault
5. Check your vault position

**Forum**
1. Click **Forum** in the nav bar
2. Click **Sign in / Sign up** and create an account
3. Post a message — it appears in the feed instantly
4. Click **Link wallet** to attach your MetaMask address to your profile — your vault balance will show as a badge on your posts

---

## Run the contract tests

Requires [Foundry](https://book.getfoundry.sh/getting-started/installation) installed locally. Foundry runs tests in an isolated in-memory EVM — no Docker or wallet needed:

```bash
cd contracts && forge test
```

---

## Fast-forwarding the 7-day lock

You don't need to wait 7 days to test withdrawals. These `curl` commands work with no extra tooling:

```bash
# Skip forward 7 days + 1 second
curl -s -X POST http://localhost:8545 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"anvil_increaseTime","params":[604801],"id":1}'

# Mine a block so the timestamp takes effect
curl -s -X POST http://localhost:8545 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"anvil_mine","params":[],"id":1}'
```

Refresh the frontend — the Withdraw button will be active.

> If you have [Foundry](https://book.getfoundry.sh/getting-started/installation) installed locally, you can use `cast` instead:
> ```bash
> cast rpc anvil_increaseTime 604801 --rpc-url http://localhost:8545
> cast rpc anvil_mine --rpc-url http://localhost:8545
> ```

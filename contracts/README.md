# contracts/

Foundry project containing the Solidity smart contracts and their test suite.

## Contracts

| Contract | Description |
|----------|-------------|
| `src/SyvoraToken.sol` | ERC-20 token (name: SyvoraToken, symbol: LRN). Deployer receives 1,000,000 LRN. Owner can mint more. |
| `src/Vault.sol` | Time-locked vault. Users deposit LRN which is locked for 7 days. Includes a reward pool claimable by depositors. |

## Dependencies

Libraries are tracked as git submodules in `contracts/lib/`:
- `forge-std` — Foundry test utilities
- `openzeppelin-contracts` — ERC-20, Ownable, ReentrancyGuard

Pull them after cloning:
```bash
git submodule update --init --recursive
```

## Run tests

No wallet or network needed — Foundry runs an in-memory EVM:

```bash
cd contracts
forge test
```

Verbose output with gas costs:
```bash
forge test -v
```

## Deploy

See the root [README.md](../README.md) for full Sepolia deployment instructions.

Quick reference:
```bash
# Dry run (no transactions sent)
bash script/deploy.sh --dry-run

# Deploy to Sepolia
bash script/deploy.sh
```

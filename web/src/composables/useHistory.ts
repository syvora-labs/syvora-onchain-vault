/**
 * useHistory — fetches Deposited/Withdrawn events for the connected user.
 *
 * Uses a read-only Contract connected to the provider (no signer needed)
 * so history can be loaded without write permissions.
 *
 * Block timestamps are batched to minimise RPC calls: we deduplicate block
 * numbers across all events and fetch each block once.
 */
import { ref, computed } from 'vue'
import { Contract, formatUnits } from 'ethers'
import type { EventLog } from 'ethers'
import { useWallet } from './useWallet'
import { VAULT_ABI } from '../contracts/abis'
import { ADDRESSES } from '../contracts/addresses'

export interface HistoryEvent {
  type: 'Deposited' | 'Withdrawn' | 'RewardClaimed'
  amount: bigint
  formattedAmount: string
  timestamp: bigint        // Unix seconds as BigInt
  txHash: string
  blockNumber: number
  logIndex: number
}

// ── Module-level shared state ─────────────────────────────────────────────────
const events    = ref<HistoryEvent[]>([])
const isLoading = ref(false)
const error     = ref<string | null>(null)

// ── Composable ────────────────────────────────────────────────────────────────
export function useHistory() {
  const { address, provider } = useWallet()

  /** Format a raw token amount to a human-readable string (4 decimals max). */
  function formatAmount(raw: bigint): string {
    const full = formatUnits(raw, 18)
    const [whole = '', frac = ''] = full.split('.')
    const trimmed = frac.slice(0, 4).replace(/0+$/, '')
    return trimmed ? `${whole}.${trimmed}` : whole
  }

  /** Fetch and sort all Deposited/Withdrawn events for the connected wallet. */
  async function refresh(): Promise<void> {
    if (!provider.value || !address.value) return
    isLoading.value = true
    error.value     = null

    try {
      // Read-only contract connected to provider (no signer)
      const contract = new Contract(ADDRESSES.vault, VAULT_ABI, provider.value)

      // Query all three event types in parallel.
      // Non-null assertion is safe: all events are declared in VAULT_ABI.
      const [depositedRaw, withdrawnRaw, claimedRaw] = await Promise.all([
        contract.queryFilter(contract.filters['Deposited']!(address.value), 0, 'latest'),
        contract.queryFilter(contract.filters['Withdrawn']!(address.value), 0, 'latest'),
        contract.queryFilter(contract.filters['RewardClaimed']!(address.value), 0, 'latest'),
      ])

      // Collect unique block numbers to batch-fetch timestamps
      const blockNumbers = new Set<number>()
      for (const log of [...depositedRaw, ...withdrawnRaw, ...claimedRaw]) {
        blockNumbers.add(log.blockNumber)
      }

      // Fetch each block once and build a number→timestamp map
      const blockTimestamps = new Map<number, bigint>()
      await Promise.all(
        [...blockNumbers].map(async (bn) => {
          const block = await provider.value!.getBlock(bn)
          if (block) blockTimestamps.set(bn, BigInt(block.timestamp))
        })
      )

      // Parse Deposited events
      const deposited: HistoryEvent[] = (depositedRaw as EventLog[]).map((log) => {
        const amount = log.args[1] as bigint
        return {
          type: 'Deposited' as const,
          amount,
          formattedAmount: formatAmount(amount),
          timestamp: blockTimestamps.get(log.blockNumber) ?? 0n,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          logIndex: log.index,
        }
      })

      // Parse Withdrawn events
      const withdrawn: HistoryEvent[] = (withdrawnRaw as EventLog[]).map((log) => {
        const amount = log.args[1] as bigint
        return {
          type: 'Withdrawn' as const,
          amount,
          formattedAmount: formatAmount(amount),
          timestamp: blockTimestamps.get(log.blockNumber) ?? 0n,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          logIndex: log.index,
        }
      })

      // Parse RewardClaimed events
      const claimed: HistoryEvent[] = (claimedRaw as EventLog[]).map((log) => {
        const amount = log.args[1] as bigint
        return {
          type: 'RewardClaimed' as const,
          amount,
          formattedAmount: formatAmount(amount),
          timestamp: blockTimestamps.get(log.blockNumber) ?? 0n,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          logIndex: log.index,
        }
      })

      // Merge and sort newest-first
      events.value = [...deposited, ...withdrawn, ...claimed].sort((a, b) => {
        const timeDiff = Number(b.timestamp - a.timestamp)
        if (timeDiff !== 0) return timeDiff
        if (b.blockNumber !== a.blockNumber) return b.blockNumber - a.blockNumber
        return b.logIndex - a.logIndex
      })
    } catch (e: unknown) {
      console.error('Failed to fetch vault history:', e)
      error.value = e instanceof Error ? e.message : 'Failed to load history'
    } finally {
      isLoading.value = false
    }
  }

  /** Etherscan (or Blockscout) base URL for the current network. */
  const explorerBase = computed(() => {
    // Sepolia by default; Anvil has no explorer so we just omit links
    return 'https://sepolia.etherscan.io'
  })

  return {
    events,
    isLoading,
    error,
    refresh,
    explorerBase,
  }
}

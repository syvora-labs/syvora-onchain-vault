/**
 * useRewards — read and claim vault rewards for the connected user.
 *
 * The on-chain `pendingRewards` view reads `block.timestamp`, which only
 * advances when a transaction is mined (a problem on local Anvil).  Instead
 * we fetch the raw position fields once and mirror the contract formula
 * client-side, ticking every second with Date.now().  This works on both
 * Anvil and live networks.
 *
 * On-chain formula (Vault.sol):
 *   accrued = amount * REWARD_RATE_PER_SECOND * elapsed / 1e18
 *   pending = rewardDebt + accrued
 */
import { ref, computed } from 'vue'
import { formatUnits } from 'ethers'
import { useWallet } from './useWallet'
import { useContracts } from './useContracts'

// Mirrors the Solidity constant
const REWARD_RATE = 1_585_489_599n

// ── Module-level shared state ─────────────────────────────────────────────────

/** Principal currently locked (used to compute accruing rewards). */
const depositedAmount = ref<bigint>(0n)

/** Rewards already settled into rewardDebt as of the last fetch. */
const settledDebt = ref<bigint>(0n)

/**
 * The `depositedAt` value from getPosition — the chain timestamp when the
 * current accrual period started.  Used as the baseline for client-side math.
 */
const accrualStart = ref<number>(0)

/** Wall-clock seconds, updated every second by the module-level ticker. */
const nowSeconds = ref<number>(Math.floor(Date.now() / 1000))

const isLoading = ref(false)
const error     = ref<string | null>(null)

// Tick once per second so the computed updates without extra RPC calls
setInterval(() => { nowSeconds.value = Math.floor(Date.now() / 1000) }, 1_000)

// ── Composable ────────────────────────────────────────────────────────────────
export function useRewards() {
  const { address } = useWallet()
  const { vaultContract } = useContracts()

  /**
   * Live pending rewards computed entirely client-side.
   * Mirrors the on-chain formula so it ticks every second even on Anvil.
   */
  const pendingRewards = computed<bigint>(() => {
    if (depositedAmount.value === 0n) return settledDebt.value
    const elapsed = BigInt(Math.max(0, nowSeconds.value - accrualStart.value))
    return settledDebt.value + (depositedAmount.value * REWARD_RATE * elapsed) / BigInt(1e18)
  })

  /** Human-readable reward amount, e.g. "4.1093" */
  const formattedRewards = computed(() => {
    if (pendingRewards.value === 0n) return '0'
    const full = formatUnits(pendingRewards.value, 18)
    const [whole = '', frac = ''] = full.split('.')
    const trimmed = frac.slice(0, 4).replace(/0+$/, '')
    return trimmed ? `${whole}.${trimmed}` : whole
  })

  /**
   * Fetch position fields from the contract and update the local snapshot.
   * After this call, pendingRewards ticks forward automatically each second.
   */
  async function refresh(): Promise<void> {
    if (!vaultContract.value || !address.value) return
    try {
      const [amount, , depositedAt, debt] = await vaultContract.value.getPosition(address.value)
      depositedAmount.value = amount
      settledDebt.value     = debt
      accrualStart.value    = Number(depositedAt)
    } catch (e: unknown) {
      console.error('Failed to fetch rewards position:', e)
    }
  }

  /** Claim all pending rewards. */
  async function claim(): Promise<void> {
    if (!vaultContract.value) return
    error.value     = null
    isLoading.value = true

    try {
      const tx = await vaultContract.value.claimRewards()
      await tx.wait()
      // Zero out local state immediately so display drops to 0 at once
      settledDebt.value     = 0n
      depositedAmount.value = 0n
      accrualStart.value    = Math.floor(Date.now() / 1000)
      // Re-fetch to sync with on-chain state
      await refresh()
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: number }).code === 4001) {
        error.value = 'Transaction rejected.'
      } else {
        error.value = e instanceof Error ? e.message : 'Claim failed'
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    pendingRewards,
    formattedRewards,
    isLoading,
    error,
    refresh,
    claim,
  }
}

/**
 * useRewards — read and claim vault rewards for the connected user.
 *
 * Uses the module-level singleton pattern so state is shared across all
 * components that call useRewards() in the same session.
 */
import { ref, computed } from 'vue'
import { formatUnits } from 'ethers'
import { useWallet } from './useWallet'
import { useContracts } from './useContracts'

// ── Module-level shared state ─────────────────────────────────────────────────
const pendingRewards = ref<bigint>(0n)
const isLoading      = ref(false)
const error          = ref<string | null>(null)

// ── Composable ────────────────────────────────────────────────────────────────
export function useRewards() {
  const { address } = useWallet()
  const { vaultContract } = useContracts()

  /** Human-readable reward amount, e.g. "4.1093" */
  const formattedRewards = computed(() => {
    if (pendingRewards.value === 0n) return '0'
    const full = formatUnits(pendingRewards.value, 18)
    const [whole, frac = ''] = full.split('.')
    const trimmed = frac.slice(0, 4).replace(/0+$/, '')
    return trimmed ? `${whole}.${trimmed}` : whole
  })

  /** Fetch the current pending rewards from the contract. */
  async function refresh(): Promise<void> {
    if (!vaultContract.value || !address.value) return
    try {
      pendingRewards.value = await vaultContract.value.pendingRewards(address.value)
    } catch (e: unknown) {
      console.error('Failed to fetch pending rewards:', e)
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

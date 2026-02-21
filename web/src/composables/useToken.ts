/**
 * useToken — reads the user's LRN token balance from the chain.
 *
 * Key concept: on-chain numbers (uint256) arrive as JavaScript BigInt values
 * in ethers v6. We use formatUnits() to convert from raw 18-decimal units
 * (e.g. 1000000000000000000n) to a human-readable string ("1.0").
 */
import { ref, computed } from 'vue'
import { formatUnits } from 'ethers'
import { useWallet } from './useWallet'
import { useContracts } from './useContracts'

export function useToken() {
  const { address } = useWallet()
  const { tokenContract } = useContracts()

  // Raw balance in wei (smallest unit) — BigInt
  const rawBalance = ref<bigint>(0n)
  const isLoading  = ref(false)
  const error      = ref<string | null>(null)

  /**
   * Balance formatted to 4 decimal places for display, e.g. "1,234.5678".
   * formatUnits(value, 18) divides by 1e18 and returns a decimal string.
   */
  const formatted = computed(() => {
    const full = formatUnits(rawBalance.value, 18) // e.g. "1234.567800000000000000"
    const [whole, frac = ''] = full.split('.')
    // Trim to 4 decimals and drop trailing zeros
    const trimmed = frac.slice(0, 4).replace(/0+$/, '')
    return trimmed ? `${whole}.${trimmed}` : whole
  })

  /** Fetch the balance from the blockchain. Call this after connecting or after a tx. */
  async function refresh(): Promise<void> {
    if (!tokenContract.value || !address.value) return
    isLoading.value = true
    error.value     = null
    try {
      rawBalance.value = await tokenContract.value.balanceOf(address.value) as bigint
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch balance'
    } finally {
      isLoading.value = false
    }
  }

  return { rawBalance, formatted, isLoading, error, refresh }
}

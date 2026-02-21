/**
 * useVault — deposit, withdraw, and read the user's Vault position.
 *
 * The deposit flow is two transactions:
 *  1. token.approve(vaultAddress, amount)  — authorise the vault to pull tokens
 *  2. vault.deposit(amount)                — vault pulls tokens and records position
 *
 * Each tx.wait() call blocks until the transaction is mined (included in a block).
 * This is important — you should never assume a tx succeeded just because it was
 * submitted; always wait for confirmation.
 */
import { ref, computed } from 'vue'
import { parseUnits, formatUnits } from 'ethers'
import { useWallet } from './useWallet'
import { useContracts } from './useContracts'


/** Tracks which step of the deposit flow we are on. */
export type DepositStep = 'idle' | 'approving' | 'depositing' | 'done'

export function useVault() {
  const { address, provider } = useWallet()
  const { tokenContract, vaultContract } = useContracts()

  // ── State ──────────────────────────────────────────────────────────────────

  const lockedAmount    = ref<bigint>(0n)   // raw uint256 from the contract
  const unlocksAt       = ref<bigint>(0n)   // Unix timestamp as BigInt
  const blockTimestamp  = ref<bigint>(0n)   // latest block timestamp from the chain
  const isLoading       = ref(false)
  const depositStep     = ref<DepositStep>('idle')
  const error           = ref<string | null>(null)

  // ── Derived state ──────────────────────────────────────────────────────────

  /** Formatted locked amount, e.g. "500.0" */
  const formattedLocked = computed(() => {
    if (lockedAmount.value === 0n) return '0'
    const full = formatUnits(lockedAmount.value, 18)
    const [whole, frac = ''] = full.split('.')
    const trimmed = frac.slice(0, 4).replace(/0+$/, '')
    return trimmed ? `${whole}.${trimmed}` : whole
  })

  /** JavaScript Date when the deposit unlocks, or null if nothing is locked. */
  const unlockDate = computed<Date | null>(() => {
    if (unlocksAt.value === 0n) return null
    // unlocksAt is seconds; Date expects milliseconds
    return new Date(Number(unlocksAt.value) * 1000)
  })

  /**
   * true  → tokens exist but lock has NOT expired yet
   * false → no tokens, or lock has expired (user can withdraw)
   *
   * Uses the latest block timestamp from the chain rather than Date.now() so
   * that anvil_increaseTime (used in local testing) is reflected correctly.
   */
  const isStillLocked = computed<boolean>(() => {
    if (lockedAmount.value === 0n) return false
    const now = blockTimestamp.value > 0n
      ? blockTimestamp.value
      : BigInt(Math.floor(Date.now() / 1000))
    return now < unlocksAt.value
  })

  const hasDeposit = computed(() => lockedAmount.value > 0n)

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Read the current position and latest block timestamp from the chain. */
  async function refresh(): Promise<void> {
    if (!vaultContract.value || !address.value) return
    try {
      const [positionResult, block] = await Promise.all([
        vaultContract.value.getPosition(address.value) as Promise<[bigint, bigint]>,
        provider.value?.getBlock('latest'),
      ])
      const [amount, unlock] = positionResult
      lockedAmount.value   = amount
      unlocksAt.value      = unlock
      if (block) blockTimestamp.value = BigInt(block.timestamp)
    } catch (e: unknown) {
      console.error('Failed to fetch vault position:', e)
    }
  }

  /**
   * Two-step deposit:
   *  1. Approve the vault to spend `amountStr` LRN tokens.
   *  2. Call vault.deposit() to move them into the vault.
   *
   * @param amountStr — decimal string from the user input, e.g. "100" or "0.5"
   */
  async function deposit(amountStr: string): Promise<void> {
    if (!tokenContract.value || !vaultContract.value) return
    error.value    = null
    isLoading.value = true

    try {
      // parseUnits("100", 18) → 100000000000000000000n
      // String() guards against Vue coercing number inputs to JS numbers at runtime
      const amount = parseUnits(String(amountStr), 18)

      // Step 1 — Approve
      depositStep.value = 'approving'
      const vaultAddress = await vaultContract.value.getAddress()
      const approveTx = await tokenContract.value.approve(vaultAddress, amount)
      // wait() resolves when the tx is mined (1 confirmation by default)
      await approveTx.wait()

      // Step 2 — Deposit
      depositStep.value = 'depositing'
      const depositTx = await vaultContract.value.deposit(amount)
      await depositTx.wait()

      depositStep.value = 'done'
      await refresh()
    } catch (e: unknown) {
      // MetaMask rejection has code 4001
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: number }).code === 4001) {
        error.value = 'Transaction rejected.'
      } else {
        error.value = e instanceof Error ? e.message : 'Deposit failed'
      }
    } finally {
      isLoading.value = false
      // Reset step after a short delay so the user sees "done" briefly
      setTimeout(() => { depositStep.value = 'idle' }, 2000)
    }
  }

  /** Withdraw all tokens (only callable after lock expires). */
  async function withdraw(): Promise<void> {
    if (!vaultContract.value) return
    error.value     = null
    isLoading.value = true

    try {
      const tx = await vaultContract.value.withdraw()
      await tx.wait()
      await refresh()
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: number }).code === 4001) {
        error.value = 'Transaction rejected.'
      } else {
        error.value = e instanceof Error ? e.message : 'Withdrawal failed'
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    lockedAmount,
    unlocksAt,
    formattedLocked,
    unlockDate,
    isStillLocked,
    hasDeposit,
    isLoading,
    depositStep,
    error,
    refresh,
    deposit,
    withdraw,
  }
}

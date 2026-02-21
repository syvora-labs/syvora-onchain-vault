/**
 * useContracts — returns typed ethers.js Contract instances.
 *
 * ethers v6's Contract class uses a broad index signature
 * ([key: string]: BaseContractMethod), which conflicts with extending it
 * with specific return-typed methods. The idiomatic workaround is to:
 *
 *  1. Define a plain interface describing only the methods we call.
 *  2. Cast via `as unknown as MyInterface` after construction.
 *
 * This gives us full autocomplete and type safety without a codegen step.
 */
import { computed } from 'vue'
import { Contract, type ContractTransactionResponse } from 'ethers'
import { useWallet } from './useWallet'
import { SYVORATOKEN_ABI, VAULT_ABI } from '../contracts/abis'
import { ADDRESSES } from '../contracts/addresses'

// ── Typed contract interfaces ────────────────────────────────────────────────
// We list only the functions and views the frontend actually needs.
// getAddress() comes from ethers' BaseContract and is always available.

export interface SyvoraTokenContract {
  balanceOf(account: string): Promise<bigint>
  approve(spender: string, value: bigint): Promise<ContractTransactionResponse>
  allowance(owner: string, spender: string): Promise<bigint>
  getAddress(): Promise<string>
}

export interface VaultContract {
  getPosition(user: string): Promise<[bigint, bigint]>
  deposit(amount: bigint): Promise<ContractTransactionResponse>
  withdraw(): Promise<ContractTransactionResponse>
  getAddress(): Promise<string>
}

// ── Composable ───────────────────────────────────────────────────────────────

export function useContracts() {
  const { signer } = useWallet()

  /**
   * SyvoraToken contract instance.
   * null when the wallet is not connected (no signer available).
   */
  const tokenContract = computed<SyvoraTokenContract | null>(() => {
    if (!signer.value) return null
    return new Contract(
      ADDRESSES.syvoraToken,
      SYVORATOKEN_ABI,
      signer.value
    ) as unknown as SyvoraTokenContract
  })

  /**
   * Vault contract instance.
   * null when the wallet is not connected.
   */
  const vaultContract = computed<VaultContract | null>(() => {
    if (!signer.value) return null
    return new Contract(
      ADDRESSES.vault,
      VAULT_ABI,
      signer.value
    ) as unknown as VaultContract
  })

  return { tokenContract, vaultContract }
}

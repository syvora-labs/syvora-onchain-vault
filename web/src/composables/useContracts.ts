import { computed } from "vue";
import { Contract, type ContractTransactionResponse } from "ethers";
import { useWallet } from "./useWallet";
import { SYVORATOKEN_ABI, VAULT_ABI } from "../contracts/abis";
import { ADDRESSES } from "../contracts/addresses";

export interface SyvoraTokenContract {
    balanceOf(account: string): Promise<bigint>;
    approve(spender: string, value: bigint): Promise<ContractTransactionResponse>;
    allowance(owner: string, spender: string): Promise<bigint>;
    getAddress(): Promise<string>;
}

export interface VaultContract {
    getPosition(user: string): Promise<[bigint, bigint, bigint, bigint]>;
    pendingRewards(user: string): Promise<bigint>;
    claimRewards(): Promise<ContractTransactionResponse>;
    fundRewardPool(amount: bigint): Promise<ContractTransactionResponse>;
    rewardPool(): Promise<bigint>;
    deposit(amount: bigint): Promise<ContractTransactionResponse>;
    withdraw(): Promise<ContractTransactionResponse>;
    getAddress(): Promise<string>;
}

export function useContracts() {
    const { signer } = useWallet();

    const tokenContract = computed<SyvoraTokenContract | null>(() => {
        if (!signer.value) return null;
        return new Contract(ADDRESSES.syvoraToken, SYVORATOKEN_ABI, signer.value) as unknown as SyvoraTokenContract;
    });

    const vaultContract = computed<VaultContract | null>(() => {
        if (!signer.value) return null;
        return new Contract(ADDRESSES.vault, VAULT_ABI, signer.value) as unknown as VaultContract;
    });

    return { tokenContract, vaultContract };
}

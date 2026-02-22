import { ref, computed } from "vue";
import { parseUnits, formatUnits } from "ethers";
import { useWallet } from "./useWallet";
import { useContracts } from "./useContracts";

export type DepositStep = "idle" | "approving" | "depositing" | "done";

export function useVault() {
    const { address } = useWallet();
    const { tokenContract, vaultContract } = useContracts();

    const lockedAmount = ref<bigint>(0n);
    const unlocksAt = ref<bigint>(0n);
    const isLoading = ref(false);
    const depositStep = ref<DepositStep>("idle");
    const error = ref<string | null>(null);

    const formattedLocked = computed(() => {
        if (lockedAmount.value === 0n) return "0";
        const full = formatUnits(lockedAmount.value, 18);
        const [whole, frac = ""] = full.split(".");
        const trimmed = frac.slice(0, 4).replace(/0+$/, "");
        return trimmed ? `${whole}.${trimmed}` : whole;
    });

    const unlockDate = computed<Date | null>(() => {
        if (unlocksAt.value === 0n) return null;
        return new Date(Number(unlocksAt.value) * 1000);
    });

    const isStillLocked = computed<boolean>(() => {
        if (lockedAmount.value === 0n) return false;
        const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
        return nowSeconds < unlocksAt.value;
    });

    const hasDeposit = computed(() => lockedAmount.value > 0n);

    async function refresh(): Promise<void> {
        if (!vaultContract.value || !address.value) return;
        try {
            const [amount, unlock, _depositedAt, _rewardDebt] = await vaultContract.value.getPosition(address.value);
            lockedAmount.value = amount;
            unlocksAt.value = unlock;
        } catch (e: unknown) {
            console.error("Failed to fetch vault position:", e);
        }
    }

    async function deposit(amountStr: string): Promise<void> {
        if (!tokenContract.value || !vaultContract.value) return;
        error.value = null;
        isLoading.value = true;

        try {
            const amount = parseUnits(String(amountStr), 18);

            depositStep.value = "approving";
            const vaultAddress = await vaultContract.value.getAddress();
            const approveTx = await tokenContract.value.approve(vaultAddress, amount);
            await approveTx.wait();

            depositStep.value = "depositing";
            const depositTx = await vaultContract.value.deposit(amount);
            await depositTx.wait();

            depositStep.value = "done";
            await refresh();
        } catch (e: unknown) {
            if (typeof e === "object" && e !== null && "code" in e && (e as { code: number }).code === 4001) {
                error.value = "Transaction rejected.";
            } else {
                error.value = e instanceof Error ? e.message : "Deposit failed";
            }
        } finally {
            isLoading.value = false;
            setTimeout(() => {
                depositStep.value = "idle";
            }, 2000);
        }
    }

    async function withdraw(): Promise<void> {
        if (!vaultContract.value) return;
        error.value = null;
        isLoading.value = true;

        try {
            const tx = await vaultContract.value.withdraw();
            await tx.wait();
            await refresh();
        } catch (e: unknown) {
            if (typeof e === "object" && e !== null && "code" in e && (e as { code: number }).code === 4001) {
                error.value = "Transaction rejected.";
            } else {
                error.value = e instanceof Error ? e.message : "Withdrawal failed";
            }
        } finally {
            isLoading.value = false;
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
    };
}

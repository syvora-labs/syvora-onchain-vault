import { ref, computed } from "vue";
import { formatUnits } from "ethers";
import { useWallet } from "./useWallet";
import { useContracts } from "./useContracts";

const REWARD_RATE = 1_585_489_599n;

const depositedAmount = ref<bigint>(0n);
const settledDebt = ref<bigint>(0n);
const accrualStart = ref<number>(0);
const nowSeconds = ref<number>(Math.floor(Date.now() / 1000));
const isLoading = ref(false);
const error = ref<string | null>(null);

setInterval(() => {
    nowSeconds.value = Math.floor(Date.now() / 1000);
}, 1_000);

export function useRewards() {
    const { address } = useWallet();
    const { vaultContract } = useContracts();

    const pendingRewards = computed<bigint>(() => {
        if (depositedAmount.value === 0n) return settledDebt.value;
        const elapsed = BigInt(Math.max(0, nowSeconds.value - accrualStart.value));
        return settledDebt.value + (depositedAmount.value * REWARD_RATE * elapsed) / BigInt(1e18);
    });

    const formattedRewards = computed(() => {
        if (pendingRewards.value === 0n) return "0";
        const full = formatUnits(pendingRewards.value, 18);
        const [whole = "", frac = ""] = full.split(".");
        const trimmed = frac.slice(0, 4).replace(/0+$/, "");
        return trimmed ? `${whole}.${trimmed}` : whole;
    });

    async function refresh(): Promise<void> {
        if (!vaultContract.value || !address.value) return;
        try {
            const [amount, , depositedAt, debt] = await vaultContract.value.getPosition(address.value);
            depositedAmount.value = amount;
            settledDebt.value = debt;
            accrualStart.value = Number(depositedAt);
        } catch (e: unknown) {
            console.error("Failed to fetch rewards position:", e);
        }
    }

    async function claim(): Promise<void> {
        if (!vaultContract.value) return;
        error.value = null;
        isLoading.value = true;

        try {
            const tx = await vaultContract.value.claimRewards();
            await tx.wait();
            settledDebt.value = 0n;
            depositedAmount.value = 0n;
            accrualStart.value = Math.floor(Date.now() / 1000);
            await refresh();
        } catch (e: unknown) {
            if (typeof e === "object" && e !== null && "code" in e && (e as { code: number }).code === 4001) {
                error.value = "Transaction rejected.";
            } else {
                error.value = e instanceof Error ? e.message : "Claim failed";
            }
        } finally {
            isLoading.value = false;
        }
    }

    return {
        pendingRewards,
        formattedRewards,
        isLoading,
        error,
        refresh,
        claim,
    };
}

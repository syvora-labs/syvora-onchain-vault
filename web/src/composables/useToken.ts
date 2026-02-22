import { ref, computed } from "vue";
import { formatUnits } from "ethers";
import { useWallet } from "./useWallet";
import { useContracts } from "./useContracts";

export function useToken() {
    const { address } = useWallet();
    const { tokenContract } = useContracts();

    const rawBalance = ref<bigint>(0n);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const formatted = computed(() => {
        const full = formatUnits(rawBalance.value, 18);
        const [whole, frac = ""] = full.split(".");
        const trimmed = frac.slice(0, 4).replace(/0+$/, "");
        return trimmed ? `${whole}.${trimmed}` : whole;
    });

    async function refresh(): Promise<void> {
        if (!tokenContract.value || !address.value) return;
        isLoading.value = true;
        error.value = null;
        try {
            rawBalance.value = (await tokenContract.value.balanceOf(address.value)) as bigint;
        } catch (e: unknown) {
            error.value = e instanceof Error ? e.message : "Failed to fetch balance";
        } finally {
            isLoading.value = false;
        }
    }

    return { rawBalance, formatted, isLoading, error, refresh };
}

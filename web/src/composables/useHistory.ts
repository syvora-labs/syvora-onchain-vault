import { ref, computed } from "vue";
import { Contract, formatUnits } from "ethers";
import type { EventLog } from "ethers";
import { useWallet } from "./useWallet";
import { VAULT_ABI } from "../contracts/abis";
import { ADDRESSES } from "../contracts/addresses";

export interface HistoryEvent {
    type: "Deposited" | "Withdrawn" | "RewardClaimed";
    amount: bigint;
    formattedAmount: string;
    timestamp: bigint;
    txHash: string;
    blockNumber: number;
    logIndex: number;
}

const events = ref<HistoryEvent[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

export function useHistory() {
    const { address, provider } = useWallet();

    function formatAmount(raw: bigint): string {
        const full = formatUnits(raw, 18);
        const [whole = "", frac = ""] = full.split(".");
        const trimmed = frac.slice(0, 4).replace(/0+$/, "");
        return trimmed ? `${whole}.${trimmed}` : whole;
    }

    async function refresh(): Promise<void> {
        if (!provider.value || !address.value) return;
        isLoading.value = true;
        error.value = null;

        try {
            const contract = new Contract(ADDRESSES.vault, VAULT_ABI, provider.value);

            const [depositedRaw, withdrawnRaw, claimedRaw] = await Promise.all([
                contract.queryFilter(contract.filters["Deposited"]!(address.value), 0, "latest"),
                contract.queryFilter(contract.filters["Withdrawn"]!(address.value), 0, "latest"),
                contract.queryFilter(contract.filters["RewardClaimed"]!(address.value), 0, "latest"),
            ]);

            const blockNumbers = new Set<number>();
            for (const log of [...depositedRaw, ...withdrawnRaw, ...claimedRaw]) {
                blockNumbers.add(log.blockNumber);
            }

            const blockTimestamps = new Map<number, bigint>();
            await Promise.all(
                [...blockNumbers].map(async (bn) => {
                    const block = await provider.value!.getBlock(bn);
                    if (block) blockTimestamps.set(bn, BigInt(block.timestamp));
                }),
            );

            const deposited: HistoryEvent[] = (depositedRaw as EventLog[]).map((log) => {
                const amount = log.args[1] as bigint;
                return {
                    type: "Deposited" as const,
                    amount,
                    formattedAmount: formatAmount(amount),
                    timestamp: blockTimestamps.get(log.blockNumber) ?? 0n,
                    txHash: log.transactionHash,
                    blockNumber: log.blockNumber,
                    logIndex: log.index,
                };
            });

            const withdrawn: HistoryEvent[] = (withdrawnRaw as EventLog[]).map((log) => {
                const amount = log.args[1] as bigint;
                return {
                    type: "Withdrawn" as const,
                    amount,
                    formattedAmount: formatAmount(amount),
                    timestamp: blockTimestamps.get(log.blockNumber) ?? 0n,
                    txHash: log.transactionHash,
                    blockNumber: log.blockNumber,
                    logIndex: log.index,
                };
            });

            const claimed: HistoryEvent[] = (claimedRaw as EventLog[]).map((log) => {
                const amount = log.args[1] as bigint;
                return {
                    type: "RewardClaimed" as const,
                    amount,
                    formattedAmount: formatAmount(amount),
                    timestamp: blockTimestamps.get(log.blockNumber) ?? 0n,
                    txHash: log.transactionHash,
                    blockNumber: log.blockNumber,
                    logIndex: log.index,
                };
            });

            events.value = [...deposited, ...withdrawn, ...claimed].sort((a, b) => {
                const timeDiff = Number(b.timestamp - a.timestamp);
                if (timeDiff !== 0) return timeDiff;
                if (b.blockNumber !== a.blockNumber) return b.blockNumber - a.blockNumber;
                return b.logIndex - a.logIndex;
            });
        } catch (e: unknown) {
            console.error("Failed to fetch vault history:", e);
            error.value = e instanceof Error ? e.message : "Failed to load history";
        } finally {
            isLoading.value = false;
        }
    }

    const explorerBase = computed(() => {
        return "https://sepolia.etherscan.io";
    });

    return {
        events,
        isLoading,
        error,
        refresh,
        explorerBase,
    };
}

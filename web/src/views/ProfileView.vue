<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useWallet } from '../composables/useWallet'
import { useVault } from '../composables/useVault'
import { useRewards } from '../composables/useRewards'
import { useHistory } from '../composables/useHistory'
import { SyvoraCard, SyvoraDataRow, SyvoraBadge, SyvoraButton, SyvoraAlert } from '@syvora/ui'

const { isConnected, address } = useWallet()

const {
    formattedLocked,
    unlockDate,
    isStillLocked,
    hasDeposit,
    isLoading: isLoadingPosition,
    error: positionError,
    refresh: refreshPosition,
    withdraw,
} = useVault()

const {
    pendingRewards,
    formattedRewards,
    isLoading: isClaiming,
    error: claimError,
    refresh: refreshRewards,
    claim,
} = useRewards()

const {
    events,
    isLoading: isLoadingHistory,
    error: historyError,
    refresh: refreshHistory,
    explorerBase,
} = useHistory()

function refreshAll() {
    refreshPosition()
    refreshRewards()
    refreshHistory()
}

async function claimAndRefresh() {
    await claim()
    refreshHistory()
}

onMounted(() => {
    if (isConnected.value) refreshAll()
    pollTimer = setInterval(() => { if (isConnected.value) refreshRewards() }, 30_000)
})

onUnmounted(() => {
    clearInterval(pollTimer)
})

watch(address, (addr) => {
    if (addr) refreshAll()
})

let pollTimer: ReturnType<typeof setInterval>

function formatUnlockDate(d: Date): string {
    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function formatEventDate(timestamp: bigint): string {
    if (timestamp === 0n) return '—'
    return new Date(Number(timestamp) * 1000).toLocaleString()
}
</script>

<template>
    <div class="content">
        <div v-if="!isConnected" class="empty-state">
            <p>Connect your wallet to view your profile.</p>
        </div>

        <template v-else>
            <!-- Vault Position -->
            <SyvoraCard title="Vault Position">
                <div v-if="isLoadingPosition && !hasDeposit" class="muted-text">Loading…</div>

                <div v-else-if="!hasDeposit" class="muted-text">
                    No tokens currently locked.
                </div>

                <template v-else>
                    <div class="position-grid">
                        <SyvoraDataRow label="Locked">
                            {{ formattedLocked }} <span class="symbol">LRN</span>
                        </SyvoraDataRow>

                        <SyvoraDataRow label="Unlocks at">
                            {{ unlockDate ? formatUnlockDate(unlockDate) : '—' }}
                        </SyvoraDataRow>

                        <SyvoraDataRow label="Status">
                            <SyvoraBadge :variant="isStillLocked ? 'warning' : 'success'">
                                {{ isStillLocked ? 'Locked' : 'Unlocked — ready to withdraw' }}
                            </SyvoraBadge>
                        </SyvoraDataRow>
                    </div>

                    <SyvoraButton
                        :variant="isStillLocked ? 'ghost' : 'primary'"
                        :disabled="isStillLocked || isLoadingPosition"
                        @click="withdraw"
                    >
                        {{ isLoadingPosition ? 'Withdrawing…' : isStillLocked ? 'Withdraw (locked)' : 'Withdraw' }}
                    </SyvoraButton>
                </template>

                <SyvoraAlert v-if="positionError" variant="error">{{ positionError }}</SyvoraAlert>
            </SyvoraCard>

            <!-- Rewards -->
            <SyvoraCard title="Rewards">
                <p class="card-subtitle">5% APY · Claimable anytime</p>

                <div class="reward-amount">
                    <span class="reward-value">{{ formattedRewards }}</span>
                    <span class="reward-unit">LRN</span>
                </div>

                <SyvoraAlert v-if="claimError" variant="error">{{ claimError }}</SyvoraAlert>

                <SyvoraButton
                    variant="primary"
                    :loading="isClaiming"
                    :disabled="pendingRewards === 0n || isClaiming"
                    @click="claimAndRefresh"
                >
                    {{ isClaiming ? 'Claiming…' : 'Claim Rewards' }}
                </SyvoraButton>

                <SyvoraButton variant="ghost" @click="refreshRewards">Refresh</SyvoraButton>
            </SyvoraCard>

            <!-- Transaction History -->
            <SyvoraCard title="Transaction History">
                <SyvoraAlert v-if="historyError" variant="error">{{ historyError }}</SyvoraAlert>

                <div v-if="isLoadingHistory" class="muted-text">Loading history…</div>

                <div v-else-if="events.length === 0" class="muted-text">No transactions yet.</div>

                <ul v-else class="history-list">
                    <li v-for="ev in events" :key="`${ev.txHash}-${ev.logIndex}`" class="history-row">
                        <SyvoraBadge :variant="ev.type === 'Deposited' ? 'deposit' : ev.type === 'Withdrawn' ? 'withdraw' : 'claim'">
                            {{ ev.type === 'Deposited' ? 'Deposit' : ev.type === 'Withdrawn' ? 'Withdraw' : 'Claim' }}
                        </SyvoraBadge>

                        <span class="history-amount">{{ ev.formattedAmount }} LRN</span>

                        <span class="history-date">{{ formatEventDate(ev.timestamp) }}</span>

                        <a :href="`${explorerBase}/tx/${ev.txHash}`" target="_blank" rel="noopener" class="history-link">
                            ↗
                        </a>
                    </li>
                </ul>
            </SyvoraCard>
        </template>
    </div>
</template>

<style scoped>
.content {
    max-width: 640px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.empty-state {
    text-align: center;
    color: var(--color-text-muted);
    padding: 3rem 0;
}

.muted-text {
    font-size: 0.9rem;
    color: var(--color-text-muted);
}

.card-subtitle {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-top: -0.5rem;
}

.position-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 0.25rem;
}

.symbol {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    font-weight: 400;
}

.reward-amount {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    padding: 0.5rem 0;
}

.reward-value {
    font-size: 2rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.reward-unit {
    font-size: 1rem;
    color: var(--color-text-muted);
}

.history-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.history-row {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--color-border);
}

.history-row:last-child {
    border-bottom: none;
}

.history-amount {
    font-variant-numeric: tabular-nums;
    font-size: 0.9rem;
}

.history-date {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    white-space: nowrap;
}

.history-link {
    color: var(--color-accent);
    text-decoration: none;
    font-size: 0.9rem;
}

.history-link:hover {
    text-decoration: underline;
}

@media (max-width: 480px) {
    .content {
        gap: 1rem;
    }

    .history-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem;
        column-gap: 0.6rem;
    }

    .history-link {
        margin-left: auto;
    }

    .history-date {
        flex: 0 0 100%;
        white-space: normal;
        order: 4;
    }
}
</style>

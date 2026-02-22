<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useWallet } from '../composables/useWallet'
import { useVault } from '../composables/useVault'
import { useRewards } from '../composables/useRewards'
import { useHistory } from '../composables/useHistory'

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
            <div class="card">
                <h2 class="card-title">Vault Position</h2>

                <div v-if="isLoadingPosition && !hasDeposit" class="loading-text">Loading…</div>

                <div v-else-if="!hasDeposit" class="empty-text">
                    No tokens currently locked.
                </div>

                <template v-else>
                    <div class="position-grid">
                        <div class="position-item">
                            <span class="position-label">Locked</span>
                            <span class="position-value">{{ formattedLocked }} <span class="symbol">LRN</span></span>
                        </div>

                        <div class="position-item">
                            <span class="position-label">Unlocks at</span>
                            <span class="position-value">
                                {{ unlockDate ? formatUnlockDate(unlockDate) : '—' }}
                            </span>
                        </div>

                        <div class="position-item">
                            <span class="position-label">Status</span>
                            <span class="status-badge" :class="isStillLocked ? 'status-locked' : 'status-unlocked'">
                                {{ isStillLocked ? 'Locked' : 'Unlocked — ready to withdraw' }}
                            </span>
                        </div>
                    </div>

                    <button class="btn" :class="isStillLocked ? 'btn-ghost' : 'btn-primary'"
                        :disabled="isStillLocked || isLoadingPosition" @click="withdraw">
                        {{ isLoadingPosition ? 'Withdrawing…' : isStillLocked ? 'Withdraw (locked)' : 'Withdraw' }}
                    </button>
                </template>

                <p v-if="positionError" class="error-text">{{ positionError }}</p>
            </div>

            <div class="card">
                <h2 class="card-title">Rewards</h2>
                <p class="card-subtitle">5% APY · Claimable anytime</p>

                <div class="reward-amount">
                    <span class="reward-value">{{ formattedRewards }}</span>
                    <span class="reward-unit">LRN</span>
                </div>

                <p v-if="claimError" class="error-text">{{ claimError }}</p>

                <button class="btn btn-primary" :disabled="pendingRewards === 0n || isClaiming"
                    @click="claimAndRefresh">
                    {{ isClaiming ? 'Claiming…' : 'Claim Rewards' }}
                </button>

                <button class="btn btn-ghost" @click="refreshRewards">Refresh</button>
            </div>

            <div class="card">
                <h2 class="card-title">Transaction History</h2>

                <p v-if="historyError" class="error-text">{{ historyError }}</p>

                <div v-if="isLoadingHistory" class="loading-text">Loading history…</div>

                <div v-else-if="events.length === 0" class="empty-text">No transactions yet.</div>

                <ul v-else class="history-list">
                    <li v-for="ev in events" :key="`${ev.txHash}-${ev.logIndex}`" class="history-row">
                        <span class="badge" :class="{
                            'badge-deposit': ev.type === 'Deposited',
                            'badge-withdraw': ev.type === 'Withdrawn',
                            'badge-claim': ev.type === 'RewardClaimed',
                        }">
                            {{ ev.type === 'Deposited' ? 'Deposit' : ev.type === 'Withdrawn' ? 'Withdraw' : 'Claim' }}
                        </span>

                        <span class="history-amount">{{ ev.formattedAmount }} LRN</span>

                        <span class="history-date">{{ formatEventDate(ev.timestamp) }}</span>

                        <a :href="`${explorerBase}/tx/${ev.txHash}`" target="_blank" rel="noopener"
                            class="history-link">
                            ↗
                        </a>
                    </li>
                </ul>
            </div>
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

.card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.card-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
}

.card-subtitle {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin: 0;
}

.position-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 0.25rem;
}

.position-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.position-label {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
}

.position-value {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--color-accent);
}

.symbol {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    font-weight: 400;
}

.status-badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
}

.status-locked {
    background: #fff3cd;
    color: #856404;
}

.status-unlocked {
    background: #d4f4e8;
    color: #1a7a50;
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

.btn {
    padding: 0.55rem 1.25rem;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: opacity 0.15s;
    align-self: flex-start;
}

.btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.btn-primary {
    background: var(--color-accent);
    color: #fff;
}

.btn-primary:not(:disabled):hover {
    opacity: 0.85;
}

.btn-ghost {
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
}

.btn-ghost:hover {
    background: var(--color-border);
}

.error-text {
    font-size: 0.85rem;
    color: var(--color-error, #e74c3c);
    margin: 0;
}

.loading-text,
.empty-text {
    font-size: 0.9rem;
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

.badge {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    letter-spacing: 0.03em;
    text-transform: uppercase;
}

.badge-deposit {
    background: #d4f4e8;
    color: #1a7a50;
}

.badge-claim {
    background: #e8e0f8;
    color: #5b3fa6;
}

.badge-withdraw {
    background: #fde8d8;
    color: #a0430a;
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
</style>

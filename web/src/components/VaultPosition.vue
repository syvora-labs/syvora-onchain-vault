<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useWallet } from '../composables/useWallet'
import { useVault } from '../composables/useVault'

const { isConnected } = useWallet()
const {
    formattedLocked,
    unlockDate,
    isStillLocked,
    hasDeposit,
    isLoading,
    error,
    refresh,
    withdraw,
} = useVault()

defineExpose({ refresh })

function formatDate(d: Date): string {
    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
    refresh()
    pollTimer = setInterval(refresh, 30_000)
})

onUnmounted(() => {
    if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
    <div class="card">
        <h2 class="card-title">Vault Position</h2>

        <div v-if="!isConnected" class="placeholder">
            Connect your wallet to see your vault position.
        </div>

        <div v-else-if="isLoading && !hasDeposit" class="placeholder">Loading…</div>

        <template v-else>
            <div v-if="!hasDeposit" class="placeholder">
                You have no tokens locked in the vault.
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
                            {{ unlockDate ? formatDate(unlockDate) : '—' }}
                        </span>
                    </div>

                    <div class="position-item">
                        <span class="position-label">Status</span>
                        <span class="badge" :class="isStillLocked ? 'badge-warning' : 'badge-success'">
                            {{ isStillLocked ? 'Locked' : 'Unlocked — ready to withdraw' }}
                        </span>
                    </div>
                </div>

                <button class="btn btn-full mt-sm" :class="isStillLocked ? 'btn-ghost' : 'btn-primary'"
                    :disabled="isStillLocked || isLoading"
                    :title="isStillLocked ? `Unlocks ${unlockDate ? formatDate(unlockDate) : 'soon'}` : ''"
                    @click="withdraw">
                    <template v-if="isLoading">Withdrawing…</template>
                    <template v-else-if="isStillLocked">Withdraw (locked)</template>
                    <template v-else>Withdraw</template>
                </button>
            </template>

            <button class="btn btn-ghost btn-sm mt-sm" :disabled="isLoading" @click="refresh">
                ↺ Refresh
            </button>

            <p v-if="error" class="error-msg mt-sm">{{ error }}</p>
        </template>
    </div>
</template>

<style scoped>
.position-grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-top: 0.25rem;
}

.position-item {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
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
</style>

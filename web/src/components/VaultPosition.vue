<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useWallet } from '../composables/useWallet'
import { useVault } from '../composables/useVault'
import { SyvoraCard, SyvoraDataRow, SyvoraBadge, SyvoraButton, SyvoraAlert, SyvoraEmptyState } from '@syvora/ui'

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
    <SyvoraCard title="Vault Position">
        <SyvoraEmptyState v-if="!isConnected">
            Connect your wallet to see your vault position.
        </SyvoraEmptyState>

        <SyvoraEmptyState v-else-if="isLoading && !hasDeposit">Loading…</SyvoraEmptyState>

        <template v-else>
            <SyvoraEmptyState v-if="!hasDeposit">You have no tokens locked in the vault.</SyvoraEmptyState>

            <template v-else>
                <div class="position-grid">
                    <SyvoraDataRow label="Locked">
                        {{ formattedLocked }} <span class="symbol">LRN</span>
                    </SyvoraDataRow>

                    <SyvoraDataRow label="Unlocks at">
                        {{ unlockDate ? formatDate(unlockDate) : '—' }}
                    </SyvoraDataRow>

                    <SyvoraDataRow label="Status">
                        <SyvoraBadge :variant="isStillLocked ? 'warning' : 'success'">
                            {{ isStillLocked ? 'Locked' : 'Unlocked — ready to withdraw' }}
                        </SyvoraBadge>
                    </SyvoraDataRow>
                </div>

                <SyvoraButton
                    :variant="isStillLocked ? 'ghost' : 'primary'"
                    full
                    :disabled="isStillLocked || isLoading"
                    :title="isStillLocked ? `Unlocks ${unlockDate ? formatDate(unlockDate) : 'soon'}` : ''"
                    @click="withdraw"
                >
                    <template v-if="isLoading">Withdrawing…</template>
                    <template v-else-if="isStillLocked">Withdraw (locked)</template>
                    <template v-else>Withdraw</template>
                </SyvoraButton>
            </template>

            <SyvoraButton variant="ghost" size="sm" :disabled="isLoading" @click="refresh">
                ↺ Refresh
            </SyvoraButton>

            <SyvoraAlert v-if="error" variant="error">{{ error }}</SyvoraAlert>
        </template>
    </SyvoraCard>
</template>

<style scoped>
.position-grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-top: 0.25rem;
}

.symbol {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    font-weight: 400;
}
</style>

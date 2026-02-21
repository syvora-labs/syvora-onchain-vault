<script setup lang="ts">
/**
 * TokenBalance — displays the user's LRN wallet balance.
 *
 * The parent calls refresh() on this component after a deposit/withdrawal
 * via the exposed method.
 */
import { onMounted } from 'vue'
import { useToken } from '../composables/useToken'
import { useWallet } from '../composables/useWallet'

const { isConnected } = useWallet()
const { formatted, isLoading, error, refresh } = useToken()

// Fetch balance as soon as the component mounts (wallet already connected)
onMounted(refresh)

// Expose refresh so App.vue can call it after transactions
defineExpose({ refresh })
</script>

<template>
  <div class="card">
    <h2 class="card-title">Wallet Balance</h2>

    <div v-if="!isConnected" class="placeholder">
      Connect your wallet to see your balance.
    </div>

    <div v-else-if="isLoading" class="placeholder">Loading…</div>

    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <div v-else class="balance-display">
      <span class="balance-amount">{{ formatted }}</span>
      <span class="balance-symbol">LRN</span>
    </div>

    <button
      v-if="isConnected"
      class="btn btn-ghost btn-sm mt-sm"
      :disabled="isLoading"
      @click="refresh"
    >
      ↺ Refresh
    </button>
  </div>
</template>

<style scoped>
.balance-display {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.balance-amount {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-accent);
}

.balance-symbol {
  font-size: 1rem;
  color: var(--color-text-muted);
}
</style>

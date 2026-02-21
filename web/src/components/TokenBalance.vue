<script setup lang="ts">
import { onMounted } from 'vue'
import { useToken } from '../composables/useToken'
import { useWallet } from '../composables/useWallet'

const { isConnected } = useWallet()
const { formatted, isLoading, error, refresh } = useToken()

onMounted(refresh)
defineExpose({ refresh })
</script>

<template>
  <div class="hero-balance">
    <p class="hero-label">Wallet Balance</p>

    <div v-if="!isConnected" class="hero-placeholder">
      Connect your wallet to see your balance.
    </div>

    <div v-else-if="isLoading" class="hero-placeholder">Loading…</div>

    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <div v-else class="balance-row">
      <span class="balance-amount">{{ formatted }}</span>
      <span class="balance-symbol">LRN</span>
    </div>

    <button
      v-if="isConnected"
      class="btn btn-ghost btn-sm refresh-btn"
      :disabled="isLoading"
      @click="refresh"
    >
      ↺ Refresh
    </button>
  </div>
</template>

<style scoped>
.hero-balance {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2.5rem 1.5rem 3rem;
  gap: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.hero-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-text-muted);
}

.hero-placeholder {
  font-size: 1.1rem;
  color: var(--color-text-muted);
  padding: 1rem 0;
}

.balance-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.balance-amount {
  font-size: 4.5rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--color-accent);
}

.balance-symbol {
  font-size: 1.75rem;
  font-weight: 400;
  color: var(--color-text-muted);
}

.refresh-btn {
  opacity: 0.5;
  margin-top: 0.25rem;
}
.refresh-btn:not(:disabled):hover { opacity: 1; }
</style>

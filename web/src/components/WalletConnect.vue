<script setup lang="ts">
/**
 * WalletConnect — shows a connect button or the connected address.
 *
 * Emits a `connected` event after a successful wallet connection so the parent
 * (App.vue) can trigger a data refresh.
 */
import { ref } from 'vue'
import { useWallet } from '../composables/useWallet'

const emit = defineEmits<{ connected: [] }>()

const { address, isConnected, isWrongNetwork, connect, disconnect } = useWallet()

const isConnecting = ref(false)
const error        = ref<string | null>(null)

async function handleConnect() {
  isConnecting.value = true
  error.value        = null
  try {
    await connect()
    emit('connected')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Connection failed'
  } finally {
    isConnecting.value = false
  }
}

/** Show only the first 6 and last 4 characters of the address. */
function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
</script>

<template>
  <div class="wallet-connect">
    <!-- Not connected -->
    <template v-if="!isConnected">
      <button
        class="btn btn-primary"
        :disabled="isConnecting"
        @click="handleConnect"
      >
        {{ isConnecting ? 'Connecting…' : 'Connect Wallet' }}
      </button>
    </template>

    <!-- Connected -->
    <template v-else>
      <div class="wallet-info">
        <!-- Network warning -->
        <span v-if="isWrongNetwork" class="badge badge-warning">
          Wrong network
        </span>
        <span v-else class="badge badge-success">Sepolia</span>

        <!-- Truncated address -->
        <span class="address">{{ shortenAddress(address!) }}</span>

        <button class="btn btn-ghost btn-sm" @click="disconnect">
          Disconnect
        </button>
      </div>
    </template>

    <!-- Error message -->
    <p v-if="error" class="error-msg">{{ error }}</p>
  </div>
</template>

<style scoped>
.wallet-connect {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.wallet-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.address {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}
</style>

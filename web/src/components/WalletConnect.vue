<script setup lang="ts">
import { ref } from 'vue'
import { useWallet } from '../composables/useWallet'
import { REQUIRED_NETWORK_NAME } from '../contracts/addresses'

const emit = defineEmits<{ connected: [] }>()

const { address, isConnected, isWrongNetwork, connect, disconnect } = useWallet()

const isConnecting = ref(false)
const error = ref<string | null>(null)

async function handleConnect() {
    isConnecting.value = true
    error.value = null
    try {
        await connect()
        emit('connected')
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'Connection failed'
    } finally {
        isConnecting.value = false
    }
}

function shortenAddress(addr: string): string {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
</script>

<template>
    <div class="wallet-connect">
        <template v-if="!isConnected">
            <button class="btn btn-primary" :disabled="isConnecting" @click="handleConnect">
                {{ isConnecting ? 'Connecting…' : 'Connect Wallet' }}
            </button>
        </template>

        <template v-else>
            <div class="wallet-info">
                <span v-if="isWrongNetwork" class="badge badge-warning">
                    Wrong network
                </span>
                <span v-else class="badge badge-success">{{ REQUIRED_NETWORK_NAME }}</span>

                <span class="address">{{ shortenAddress(address!) }}</span>

                <button class="btn btn-ghost btn-sm" @click="disconnect">
                    Disconnect
                </button>
            </div>
        </template>

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
    flex-wrap: wrap;
    justify-content: flex-end;
}

.address {
    font-family: monospace;
    font-size: 0.9rem;
    color: var(--color-text-muted);
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import { useWallet } from '../composables/useWallet'
import { REQUIRED_NETWORK_NAME } from '../contracts/addresses'
import { SyvoraButton, SyvoraBadge, SyvoraAlert } from '@syvora/ui'

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
            <SyvoraButton variant="primary" :loading="isConnecting" :disabled="isConnecting" @click="handleConnect">
                {{ isConnecting ? 'Connecting…' : 'Connect Wallet' }}
            </SyvoraButton>
        </template>

        <template v-else>
            <div class="wallet-info">
                <SyvoraBadge v-if="isWrongNetwork" variant="warning">Wrong network</SyvoraBadge>
                <SyvoraBadge v-else variant="success">{{ REQUIRED_NETWORK_NAME }}</SyvoraBadge>

                <span class="address">{{ shortenAddress(address!) }}</span>

                <SyvoraButton variant="ghost" size="sm" @click="disconnect">Disconnect</SyvoraButton>
            </div>
        </template>

        <SyvoraAlert v-if="error" variant="error">{{ error }}</SyvoraAlert>
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

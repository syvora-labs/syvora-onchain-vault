<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import TokenBalance from '../components/TokenBalance.vue'
import DepositForm from '../components/DepositForm.vue'
import VaultPosition from '../components/VaultPosition.vue'
import { useWallet } from '../composables/useWallet'

const { isConnected } = useWallet()

const tokenBalanceRef = ref<InstanceType<typeof TokenBalance> | null>(null)
const vaultPositionRef = ref<InstanceType<typeof VaultPosition> | null>(null)

function refreshAll() {
    tokenBalanceRef.value?.refresh()
    vaultPositionRef.value?.refresh()
}

watch(isConnected, (connected) => {
    if (connected) refreshAll()
})

onMounted(() => {
    if (isConnected.value) refreshAll()
})

function onDeposited() {
    tokenBalanceRef.value?.refresh()
    vaultPositionRef.value?.refresh()
}
</script>

<template>
    <div class="content">
        <div class="hero">
            <TokenBalance ref="tokenBalanceRef" />
        </div>

        <div class="actions">
            <DepositForm @deposited="onDeposited" />
            <VaultPosition ref="vaultPositionRef" />
        </div>
    </div>
</template>

<style scoped>
.content {
    max-width: 960px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
}

.actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    align-items: start;
}

@media (max-width: 640px) {
    .actions {
        grid-template-columns: 1fr;
    }
}
</style>

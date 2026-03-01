<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWallet } from '../composables/useWallet'
import { useVault } from '../composables/useVault'
import { SyvoraCard, SyvoraInput, SyvoraButton, SyvoraStepIndicator, SyvoraAlert, SyvoraEmptyState } from '@syvora/ui'

const emit = defineEmits<{ deposited: [] }>()

const { isConnected } = useWallet()
const { isLoading, depositStep, error, deposit } = useVault()

const amountInput = ref('')

const isValidAmount = computed(() => {
    const n = parseFloat(amountInput.value)
    return !isNaN(n) && n > 0
})

const activeStep = computed(() => {
    if (depositStep.value === 'approving') return 0
    if (depositStep.value === 'depositing') return 1
    return -1
})

const buttonLabel = computed(() => {
    switch (depositStep.value) {
        case 'approving': return 'Approving… (1/2)'
        case 'depositing': return 'Depositing… (2/2)'
        case 'done': return 'Deposited!'
        default: return 'Deposit'
    }
})

async function handleDeposit() {
    if (!isValidAmount.value) return
    await deposit(amountInput.value)
    if (!error.value) {
        amountInput.value = ''
        emit('deposited')
    }
}
</script>

<template>
    <SyvoraCard title="Deposit LRN">
        <SyvoraEmptyState v-if="!isConnected">Connect your wallet to deposit.</SyvoraEmptyState>

        <template v-else>
            <p class="info-text">
                Tokens are locked for <strong>7 days</strong> after deposit.
                A second deposit resets the timer.
            </p>

            <SyvoraStepIndicator
                :steps="['Approve — allow the Vault to spend your tokens', 'Deposit — transfer tokens into the Vault']"
                :active-step="activeStep"
            />

            <SyvoraInput
                v-model="amountInput"
                placeholder="Amount"
                suffix="LRN"
                inputmode="decimal"
                :disabled="isLoading"
            />

            <SyvoraButton variant="primary" full :loading="isLoading" :disabled="!isValidAmount || isLoading" @click="handleDeposit">
                {{ buttonLabel }}
            </SyvoraButton>

            <SyvoraAlert v-if="error" variant="error">{{ error }}</SyvoraAlert>
        </template>
    </SyvoraCard>
</template>

<style scoped>
.info-text {
    font-size: 0.875rem;
    color: var(--color-text-muted);
}
</style>

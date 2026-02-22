<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWallet } from '../composables/useWallet'
import { useVault } from '../composables/useVault'

const emit = defineEmits<{ deposited: [] }>()

const { isConnected } = useWallet()
const { isLoading, depositStep, error, deposit } = useVault()

const amountInput = ref('')

const isValidAmount = computed(() => {
    const n = parseFloat(amountInput.value)
    return !isNaN(n) && n > 0
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
    <div class="card">
        <h2 class="card-title">Deposit LRN</h2>

        <div v-if="!isConnected" class="placeholder">
            Connect your wallet to deposit.
        </div>

        <template v-else>
            <p class="info-text">
                Tokens are locked for <strong>7 days</strong> after deposit.
                A second deposit resets the timer.
            </p>

            <div class="steps">
                <div class="step" :class="{ active: depositStep === 'approving' }">
                    <span class="step-number">1</span>
                    <span>Approve — allow the Vault to spend your tokens</span>
                </div>
                <div class="step" :class="{ active: depositStep === 'depositing' }">
                    <span class="step-number">2</span>
                    <span>Deposit — transfer tokens into the Vault</span>
                </div>
            </div>

            <div class="input-group">
                <input v-model="amountInput" type="text" inputmode="decimal" placeholder="Amount (LRN)" class="input"
                    :disabled="isLoading" />
                <span class="input-suffix">LRN</span>
            </div>

            <button class="btn btn-primary btn-full" :disabled="!isValidAmount || isLoading" @click="handleDeposit">
                {{ buttonLabel }}
            </button>

            <p v-if="error" class="error-msg mt-sm">{{ error }}</p>
        </template>
    </div>
</template>

<style scoped>
.info-text {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin-bottom: 1rem;
}

.steps {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
}

.step {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: var(--color-text-muted);
    transition: color 0.2s;
}

.step.active {
    color: var(--color-accent);
    font-weight: 600;
}

.step-number {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    border: 1px solid currentColor;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    flex-shrink: 0;
}

.input-group {
    position: relative;
    margin-bottom: 1rem;
}

.input {
    width: 100%;
    padding: 0.75rem 3.5rem 0.75rem 1rem;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    color: var(--color-text);
    font-size: 1rem;
    box-sizing: border-box;
    transition: border-color 0.2s;
}

.input:focus {
    outline: none;
    border-color: var(--color-accent);
}

.input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.input::-webkit-outer-spin-button,
.input::-webkit-inner-spin-button {
    -webkit-appearance: none;
}

.input-suffix {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-muted);
    font-size: 0.875rem;
    pointer-events: none;
}
</style>

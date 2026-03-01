<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { SyvoraModal, SyvoraFormField } from '@syvora/ui'

const emit = defineEmits<{ close: [] }>()

const { signIn, signUp } = useAuth()

const mode = ref<'login' | 'signup'>('login')
const email = ref('')
const password = ref('')
const username = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
    error.value = ''
    loading.value = true
    try {
        if (mode.value === 'login') {
            await signIn(email.value, password.value)
        } else {
            await signUp(email.value, password.value, username.value)
        }
        emit('close')
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : 'An error occurred'
    } finally {
        loading.value = false
    }
}

function switchMode(m: 'login' | 'signup') {
    mode.value = m
    error.value = ''
}
</script>

<template>
    <SyvoraModal :title="mode === 'login' ? 'Sign In' : 'Sign Up'" size="sm" @close="emit('close')">
        <form class="modal-form" @submit.prevent="submit">
            <SyvoraFormField v-if="mode === 'signup'" label="Username" for="am-username">
                <input
                    id="am-username"
                    v-model="username"
                    class="field-input"
                    type="text"
                    placeholder="yourname"
                    required
                    autocomplete="username"
                />
            </SyvoraFormField>

            <SyvoraFormField label="Email" for="am-email">
                <input
                    id="am-email"
                    v-model="email"
                    class="field-input"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autocomplete="email"
                />
            </SyvoraFormField>

            <SyvoraFormField label="Password" for="am-password">
                <input
                    id="am-password"
                    v-model="password"
                    class="field-input"
                    type="password"
                    placeholder="••••••••"
                    required
                    :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                />
            </SyvoraFormField>

            <div v-if="error" class="error-box">{{ error }}</div>

            <button class="submit-btn" type="submit" :disabled="loading">
                {{ loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account' }}
            </button>
        </form>

        <p class="toggle-text">
            <template v-if="mode === 'login'">
                No account?
                <button class="link-btn" type="button" @click="switchMode('signup')">Sign Up</button>
            </template>
            <template v-else>
                Already have an account?
                <button class="link-btn" type="button" @click="switchMode('login')">Sign In</button>
            </template>
        </p>
    </SyvoraModal>
</template>

<style scoped>
.modal-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.field-input {
    background: var(--color-bg, #111);
    border: 1px solid var(--color-border, #333);
    border-radius: 0.5rem;
    color: var(--color-text, #fff);
    font-size: 0.9375rem;
    padding: 0.625rem 0.75rem;
    width: 100%;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.15s;
}

.field-input:focus {
    border-color: var(--color-accent, #4ade80);
}

.error-box {
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid rgba(220, 38, 38, 0.3);
    border-radius: 0.5rem;
    color: #f87171;
    font-size: 0.875rem;
    padding: 0.625rem 0.75rem;
}

.submit-btn {
    background: var(--color-accent, #4ade80);
    border: none;
    border-radius: 0.5rem;
    color: #fff;
    cursor: pointer;
    font-size: 0.9375rem;
    font-weight: 600;
    padding: 0.75rem;
    width: 100%;
    transition: opacity 0.15s;
    margin-top: 0.25rem;
}

.submit-btn:hover:not(:disabled) {
    opacity: 0.85;
}

.submit-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.toggle-text {
    font-size: 0.875rem;
    color: var(--color-text-muted, #888);
    margin: 0;
    text-align: center;
}

.link-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-accent, #4ade80);
    font-size: inherit;
    padding: 0;
    text-decoration: underline;
}
</style>

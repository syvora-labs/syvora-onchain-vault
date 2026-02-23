<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

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
    <div class="overlay" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true">
            <div class="modal-header">
                <h2 class="modal-title">{{ mode === 'login' ? 'Sign In' : 'Sign Up' }}</h2>
                <button class="close-btn" aria-label="Close" @click="emit('close')">✕</button>
            </div>

            <form class="modal-form" @submit.prevent="submit">
                <div v-if="mode === 'signup'" class="field">
                    <label class="label" for="am-username">Username</label>
                    <input
                        id="am-username"
                        v-model="username"
                        class="input"
                        type="text"
                        placeholder="yourname"
                        required
                        autocomplete="username"
                    />
                </div>

                <div class="field">
                    <label class="label" for="am-email">Email</label>
                    <input
                        id="am-email"
                        v-model="email"
                        class="input"
                        type="email"
                        placeholder="you@example.com"
                        required
                        autocomplete="email"
                    />
                </div>

                <div class="field">
                    <label class="label" for="am-password">Password</label>
                    <input
                        id="am-password"
                        v-model="password"
                        class="input"
                        type="password"
                        placeholder="••••••••"
                        required
                        :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                    />
                </div>

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
        </div>
    </div>
</template>

<style scoped>
.overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
}

.modal {
    background: var(--color-surface, #1e1e1e);
    border: 1px solid var(--color-border, #333);
    border-radius: 0.75rem;
    padding: 2rem;
    width: 100%;
    max-width: 420px;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
}

.modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted, #888);
    font-size: 1rem;
    line-height: 1;
    padding: 0.25rem 0.5rem;
}

.close-btn:hover {
    color: var(--color-text, #fff);
}

.modal-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted, #aaa);
}

.input {
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

.input:focus {
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
    margin: 1.25rem 0 0;
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

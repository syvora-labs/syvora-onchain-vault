<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Contract, formatUnits } from 'ethers'
import { useWallet } from '../composables/useWallet'
import { useAuth } from '../composables/useAuth'
import { VAULT_ABI } from '../contracts/abis'
import { ADDRESSES } from '../contracts/addresses'
import type { VaultContract } from '../composables/useContracts'
import type { PostWithProfile } from '../composables/useForum'

const props = defineProps<{
    post: PostWithProfile
}>()

const emit = defineEmits<{ delete: [id: string] }>()

const { provider } = useWallet()
const { currentUser } = useAuth()

const vaultBalance = ref<string | null>(null)

const isOwnPost = computed(() => currentUser.value?.id === props.post.user_id)

onMounted(async () => {
    const walletAddress = props.post.profiles?.wallet_address
    if (!walletAddress || !provider.value) return
    try {
        const contract = new Contract(ADDRESSES.vault, VAULT_ABI, provider.value) as unknown as VaultContract
        const [locked] = await contract.getPosition(walletAddress)
        if (locked > 0n) {
            vaultBalance.value = Number(formatUnits(locked, 18)).toFixed(2)
        }
    } catch { /* */ }
})

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}
</script>

<template>
    <div class="post-card">
        <div class="post-header">
            <span class="username">@{{ post.profiles?.username }}</span>
            <span v-if="vaultBalance" class="vault-badge">{{ vaultBalance }} LRN locked</span>
        </div>

        <p class="post-content">{{ post.content }}</p>

        <div class="post-footer">
            <span class="timestamp">{{ timeAgo(post.created_at) }}</span>
            <button v-if="isOwnPost" class="delete-btn" @click="emit('delete', post.id)">
                Delete
            </button>
        </div>
    </div>
</template>

<style scoped>
.post-card {
    background: var(--color-surface, #1e1e1e);
    border: 1px solid var(--color-border, #2a2a2a);
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
}

.post-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.username {
    font-weight: 600;
    font-size: 0.9375rem;
}

.vault-badge {
    background: rgba(74, 222, 128, 0.12);
    border: 1px solid rgba(74, 222, 128, 0.3);
    border-radius: 9999px;
    color: #4ade80;
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.125rem 0.625rem;
}

.post-content {
    font-size: 0.9375rem;
    line-height: 1.55;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
}

.post-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.timestamp {
    color: var(--color-text-muted, #888);
    font-size: 0.8125rem;
}

.delete-btn {
    background: none;
    border: none;
    color: #f87171;
    cursor: pointer;
    font-size: 0.8125rem;
    padding: 0;
}

.delete-btn:hover {
    text-decoration: underline;
}
</style>

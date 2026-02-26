<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
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

const avatarUrl = computed(() => props.post.profiles?.avatar_url ?? null)

const avatarInitial = computed(() =>
    (props.post.profiles?.username ?? '?').charAt(0).toUpperCase()
)

const avatarBg = computed(() => {
    const name = props.post.profiles?.username ?? ''
    let hash = 0
    for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
    return `hsl(${Math.abs(hash) % 360}, 55%, 38%)`
})

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
            <RouterLink
                :to="`/u/${post.profiles?.username}`"
                class="post-avatar"
                :style="{ background: avatarBg }"
            >
                <img v-if="avatarUrl" :src="avatarUrl" :alt="post.profiles?.username" class="avatar-img" />
                <span v-else class="avatar-initial">{{ avatarInitial }}</span>
            </RouterLink>

            <div class="post-meta">
                <RouterLink :to="`/u/${post.profiles?.username}`" class="username">
                    {{ post.profiles?.display_name ?? post.profiles?.username }}
                </RouterLink>
                <span class="username-handle">@{{ post.profiles?.username }}</span>
            </div>

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
    gap: 0.625rem;
    flex-wrap: wrap;
}

.post-avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    text-decoration: none;
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-initial {
    color: #fff;
    font-size: 0.8125rem;
    font-weight: 700;
    line-height: 1;
}

.post-meta {
    display: flex;
    flex-direction: column;
    gap: 0.0625rem;
    min-width: 0;
}

.username {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--color-text, #fff);
    text-decoration: none;
    line-height: 1.2;
}

.username:hover {
    text-decoration: underline;
}

.username-handle {
    font-size: 0.8125rem;
    color: var(--color-text-muted, #888);
    line-height: 1.2;
}

.vault-badge {
    background: rgba(74, 222, 128, 0.12);
    border: 1px solid rgba(74, 222, 128, 0.3);
    border-radius: 9999px;
    color: #4ade80;
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.125rem 0.625rem;
    margin-left: auto;
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

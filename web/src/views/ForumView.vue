<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useForum } from '../composables/useForum'
import { useWallet } from '../composables/useWallet'
import PostCard from '../components/PostCard.vue'
import AuthModal from '../components/AuthModal.vue'

const { isAuthenticated, currentProfile, currentUser, signOut, linkWallet } = useAuth()
const { posts, fetchPosts, createPost, deletePost, subscribe } = useForum()
const { isConnected, address } = useWallet()

const showAuthModal = ref(false)
const composerText = ref('')
const postError = ref('')
const posting = ref(false)
const signingOut = ref(false)
const linkingWallet = ref(false)

// Show link-wallet button when user is logged in, wallet is connected, but no wallet saved yet
const canLinkWallet = computed(
    () =>
        isAuthenticated.value &&
        isConnected.value &&
        address.value &&
        !currentProfile.value?.wallet_address,
)

const charCount = computed(() => composerText.value.length)

let unsubscribe: (() => void) | null = null

onMounted(async () => {
    await fetchPosts()
    unsubscribe = subscribe()
})

onUnmounted(() => {
    unsubscribe?.()
})

async function submitPost() {
    if (!composerText.value.trim()) return
    postError.value = ''
    posting.value = true
    try {
        await createPost(composerText.value.trim())
        composerText.value = ''
    } catch (e: unknown) {
        postError.value = e instanceof Error ? e.message : 'Failed to post'
    } finally {
        posting.value = false
    }
}

async function handleSignOut() {
    signingOut.value = true
    try {
        await signOut()
    } finally {
        signingOut.value = false
    }
}

async function handleLinkWallet() {
    if (!address.value) return
    linkingWallet.value = true
    try {
        await linkWallet(address.value)
    } catch (e: unknown) {
        console.error('Failed to link wallet:', e)
    } finally {
        linkingWallet.value = false
    }
}
</script>

<template>
    <div class="forum-page">
        <div class="forum-inner">
            <!-- Header -->
            <div class="forum-header">
                <h1 class="forum-title">Forum</h1>
                <div class="header-actions">
                    <template v-if="isAuthenticated">
                        <span class="current-user">@{{ currentProfile?.username }}</span>
                        <button
                            v-if="canLinkWallet"
                            class="btn btn-ghost btn-sm"
                            :disabled="linkingWallet"
                            @click="handleLinkWallet"
                        >
                            {{ linkingWallet ? 'Linking…' : 'Link wallet' }}
                        </button>
                        <button
                            class="btn btn-ghost btn-sm"
                            :disabled="signingOut"
                            @click="handleSignOut"
                        >
                            {{ signingOut ? 'Signing out…' : 'Sign out' }}
                        </button>
                    </template>
                    <template v-else>
                        <button class="btn btn-primary btn-sm" @click="showAuthModal = true">
                            Sign in / Sign up
                        </button>
                    </template>
                </div>
            </div>

            <!-- Composer -->
            <div v-if="isAuthenticated" class="composer">
                <textarea
                    v-model="composerText"
                    class="composer-input"
                    placeholder="What's on your mind? (280 chars max)"
                    maxlength="280"
                    rows="3"
                    @keydown.ctrl.enter="submitPost"
                    @keydown.meta.enter="submitPost"
                />
                <div class="composer-footer">
                    <span class="char-count" :class="{ 'char-count--warn': charCount > 260 }">
                        {{ charCount }}/280
                    </span>
                    <button
                        class="btn btn-primary btn-sm"
                        :disabled="posting || !composerText.trim()"
                        @click="submitPost"
                    >
                        {{ posting ? 'Posting…' : 'Post' }}
                    </button>
                </div>
                <div v-if="postError" class="error-box">{{ postError }}</div>
            </div>

            <!-- Feed -->
            <div class="feed">
                <div v-if="posts.length === 0" class="empty-state">
                    No posts yet. Be the first!
                </div>
                <PostCard
                    v-for="post in posts"
                    :key="post.id"
                    :post="post"
                    @delete="deletePost"
                />
            </div>
        </div>

        <!-- Auth modal -->
        <AuthModal v-if="showAuthModal" @close="showAuthModal = false" />
    </div>
</template>

<style scoped>
.forum-page {
    max-width: 680px;
    margin: 0 auto;
    padding: 0 1rem;
}

.forum-inner {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Header */
.forum-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.forum-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    flex-wrap: wrap;
}

.current-user {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-text-muted, #aaa);
}

/* Buttons */
.btn {
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.5rem 1rem;
    transition: opacity 0.15s;
    line-height: 1;
}

.btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.btn-primary {
    background: var(--color-accent, #4ade80);
    color: #fff;
}

.btn-primary:hover:not(:disabled) {
    opacity: 0.85;
}

.btn-ghost {
    background: transparent;
    border: 1px solid var(--color-border, #333);
    color: var(--color-text-muted, #aaa);
}

.btn-ghost:hover:not(:disabled) {
    color: var(--color-text, #fff);
    border-color: var(--color-text-muted, #aaa);
}

.btn-sm {
    font-size: 0.8125rem;
    padding: 0.375rem 0.75rem;
}

/* Composer */
.composer {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    background: var(--color-surface, #1e1e1e);
    border: 1px solid var(--color-border, #2a2a2a);
    border-radius: 0.75rem;
    padding: 1rem;
}

.composer-input {
    background: transparent;
    border: none;
    color: var(--color-text, #fff);
    font-family: inherit;
    font-size: 0.9375rem;
    line-height: 1.55;
    outline: none;
    resize: none;
    width: 100%;
    box-sizing: border-box;
}

.composer-input::placeholder {
    color: var(--color-text-muted, #666);
}

.composer-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.char-count {
    font-size: 0.8125rem;
    color: var(--color-text-muted, #888);
}

.char-count--warn {
    color: #f59e0b;
}

.error-box {
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid rgba(220, 38, 38, 0.3);
    border-radius: 0.5rem;
    color: #f87171;
    font-size: 0.875rem;
    padding: 0.625rem 0.75rem;
}

/* Feed */
.feed {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.empty-state {
    color: var(--color-text-muted, #888);
    font-size: 0.9375rem;
    padding: 2rem 0;
    text-align: center;
}
</style>

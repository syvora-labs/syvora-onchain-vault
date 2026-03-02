<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useForum } from '../composables/useForum'
import type { CommentWithProfile } from '../composables/useForum'
import { SyvoraAvatar } from '@syvora/ui'

const props = defineProps<{ postId: string }>()

const { currentUser, isAuthenticated } = useAuth()
const { fetchComments, addComment, deleteComment } = useForum()

const comments = ref<CommentWithProfile[]>([])
const text = ref('')
const loading = ref(false)
const submitting = ref(false)

async function load() {
    loading.value = true
    comments.value = await fetchComments(props.postId)
    loading.value = false
}

async function submit() {
    if (!text.value.trim()) return
    submitting.value = true
    try {
        await addComment(props.postId, text.value.trim())
        text.value = ''
        comments.value = await fetchComments(props.postId)
    } finally {
        submitting.value = false
    }
}

async function handleDelete(id: string) {
    await deleteComment(id, props.postId)
    comments.value = comments.value.filter(c => c.id !== id)
}

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

onMounted(load)
</script>

<template>
    <div class="comments-section">
        <div v-if="loading" class="comments-status">Loading…</div>

        <template v-else>
            <div v-if="comments.length" class="comments-list">
                <div v-for="comment in comments" :key="comment.id" class="comment">
                    <RouterLink :to="`/u/${comment.profiles?.username}`" class="comment-avatar-link">
                        <SyvoraAvatar
                            :name="comment.profiles?.username ?? '?'"
                            :src="comment.profiles?.avatar_url ?? null"
                            size="sm"
                        />
                    </RouterLink>

                    <div class="comment-body">
                        <div class="comment-header">
                            <RouterLink
                                :to="`/u/${comment.profiles?.username}`"
                                class="comment-author"
                            >
                                {{ comment.profiles?.display_name ?? comment.profiles?.username }}
                            </RouterLink>
                            <span class="comment-time">{{ timeAgo(comment.created_at) }}</span>
                            <button
                                v-if="currentUser?.id === comment.user_id"
                                class="comment-delete"
                                title="Delete comment"
                                @click="handleDelete(comment.id)"
                            >×</button>
                        </div>
                        <p class="comment-content">{{ comment.content }}</p>
                    </div>
                </div>
            </div>
            <p v-else class="comments-status">No comments yet.</p>
        </template>

        <div v-if="isAuthenticated" class="comment-composer">
            <input
                v-model="text"
                class="comment-input"
                placeholder="Add a comment…"
                maxlength="500"
                @keydown.enter.exact.prevent="submit"
            />
            <button
                class="comment-submit"
                :disabled="submitting || !text.trim()"
                @click="submit"
            >
                {{ submitting ? '…' : 'Send' }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.comments-section {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    border-top: 1px solid rgba(0, 0, 0, 0.07);
    padding-top: 0.75rem;
}

.comments-status {
    font-size: 0.8125rem;
    color: var(--color-text-muted, #888);
    text-align: center;
    padding: 0.25rem 0;
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
}

.comment {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
}

.comment-avatar-link {
    text-decoration: none;
    flex-shrink: 0;
}

.comment-body {
    flex: 1;
    min-width: 0;
}

.comment-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-wrap: wrap;
}

.comment-author {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text, #111);
    text-decoration: none;
    line-height: 1.2;
}

.comment-author:hover {
    text-decoration: underline;
}

.comment-time {
    font-size: 0.75rem;
    color: var(--color-text-muted, #888);
}

.comment-delete {
    margin-left: auto;
    background: none;
    border: none;
    color: #f87171;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    padding: 0 0.125rem;
}

.comment-delete:hover {
    opacity: 0.7;
}

.comment-content {
    margin: 0.125rem 0 0;
    font-size: 0.875rem;
    line-height: 1.5;
    word-break: break-word;
    white-space: pre-wrap;
}

.comment-composer {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.comment-input {
    flex: 1;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 9999px;
    color: var(--color-text, #111);
    font-size: 0.875rem;
    min-width: 0;
    outline: none;
    padding: 0.375rem 0.875rem;
    transition: border-color 0.15s, background 0.15s;
}

.comment-input:focus {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(0, 0, 0, 0.2);
}

.comment-input::placeholder {
    color: var(--color-text-muted, #888);
}

.comment-submit {
    background: rgba(22, 163, 74, 0.12);
    border: 1px solid rgba(22, 163, 74, 0.22);
    border-radius: 9999px;
    color: #16a34a;
    cursor: pointer;
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.375rem 0.875rem;
    transition: background 0.15s;
    white-space: nowrap;
}

.comment-submit:hover:not(:disabled) {
    background: rgba(22, 163, 74, 0.2);
}

.comment-submit:disabled {
    cursor: not-allowed;
    opacity: 0.4;
}
</style>

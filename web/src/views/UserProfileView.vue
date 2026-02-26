<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../composables/useAuth'
import { useForum } from '../composables/useForum'
import type { Profile } from '../composables/useAuth'
import type { PostWithProfile } from '../composables/useForum'
import PostCard from '../components/PostCard.vue'
import EditProfileModal from '../components/EditProfileModal.vue'

const route = useRoute()
const { currentProfile } = useAuth()
const { fetchPostsByUser, deletePost } = useForum()

const profile = ref<Profile | null>(null)
const userPosts = ref<PostWithProfile[]>([])
const isLoading = ref(true)
const notFound = ref(false)
const showEditModal = ref(false)

const username = computed(() => route.params.username as string)

const isOwnProfile = computed(
    () => currentProfile.value?.username === username.value,
)

const avatarBg = computed(() => {
    const name = profile.value?.username ?? ''
    let hash = 0
    for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
    return `hsl(${Math.abs(hash) % 360}, 55%, 38%)`
})

const displayName = computed(
    () => profile.value?.display_name ?? profile.value?.username ?? '',
)

const joinedDate = computed(() => {
    if (!profile.value) return ''
    return new Date(profile.value.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
    })
})

async function load() {
    isLoading.value = true
    notFound.value = false
    profile.value = null
    userPosts.value = []

    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username.value)
        .single()

    if (!data) {
        notFound.value = true
        isLoading.value = false
        return
    }

    profile.value = data as Profile
    userPosts.value = await fetchPostsByUser(data.id)
    isLoading.value = false
}

async function handleDelete(id: string) {
    await deletePost(id)
    userPosts.value = userPosts.value.filter((p) => p.id !== id)
}

async function handleEditClose() {
    showEditModal.value = false
    // Reload profile to reflect updated data
    if (profile.value) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profile.value.id)
            .single()
        if (data) profile.value = data as Profile
    }
}

watch(username, load, { immediate: true })
</script>

<template>
    <div class="profile-page">
        <div v-if="isLoading" class="state-center">Loading…</div>

        <div v-else-if="notFound" class="state-center">
            <p>User <strong>@{{ username }}</strong> not found.</p>
        </div>

        <template v-else-if="profile">
            <!-- Profile header -->
            <div class="profile-header">
                <!-- Avatar + identity row -->
                <div class="avatar-row">
                    <div class="avatar-wrap" :style="{ background: avatarBg }">
                        <img
                            v-if="profile.avatar_url"
                            :src="profile.avatar_url"
                            :alt="profile.username"
                            class="avatar-img"
                        />
                        <span v-else class="avatar-initial">
                            {{ profile.username.charAt(0).toUpperCase() }}
                        </span>
                    </div>

                    <div class="avatar-row-right">
                        <div class="identity">
                            <h1 class="display-name">{{ displayName }}</h1>
                            <span class="handle">@{{ profile.username }}</span>
                        </div>
                        <button
                            v-if="isOwnProfile"
                            class="btn btn-ghost"
                            @click="showEditModal = true"
                        >
                            Edit profile
                        </button>
                    </div>
                </div>

                <!-- Bio -->
                <p v-if="profile.bio" class="bio">{{ profile.bio }}</p>

                <!-- Website -->
                <a
                    v-if="profile.website"
                    :href="profile.website"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="website-link"
                >
                    {{ profile.website.replace(/^https?:\/\//, '') }}
                </a>

                <!-- Meta row -->
                <div class="meta-row">
                    <span class="meta-item">Joined {{ joinedDate }}</span>
                    <span class="meta-item">{{ userPosts.length }} posts</span>
                </div>
            </div>

            <!-- Posts -->
            <div class="posts-section">
                <h2 class="section-title">Posts</h2>

                <div v-if="userPosts.length === 0" class="empty-posts">
                    No posts yet.
                </div>

                <div v-else class="posts-feed">
                    <PostCard
                        v-for="post in userPosts"
                        :key="post.id"
                        :post="post"
                        @delete="handleDelete"
                    />
                </div>
            </div>
        </template>

        <EditProfileModal
            v-if="showEditModal"
            @close="handleEditClose"
        />
    </div>
</template>

<style scoped>
.profile-page {
    max-width: 640px;
    margin: 0 auto;
    padding: 0 1rem;
}

.state-center {
    text-align: center;
    color: var(--color-text-muted, #888);
    padding: 4rem 0;
}

/* Header */
.profile-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-border, #2a2a2a);
    margin-bottom: 1.5rem;
}

.avatar-row {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.avatar-wrap {
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 3px solid var(--color-bg, #121212);
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-initial {
    font-size: 2rem;
    font-weight: 700;
    color: #fff;
}

.avatar-row-right {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    min-width: 0;
}

.identity {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
}

.display-name {
    font-size: 1.375rem;
    font-weight: 800;
    margin: 0;
    line-height: 1.2;
}

.handle {
    font-size: 0.9375rem;
    color: var(--color-text-muted, #888);
}

.bio {
    font-size: 0.9375rem;
    line-height: 1.55;
    margin: 0;
    white-space: pre-wrap;
}

.website-link {
    color: var(--color-accent, #4ade80);
    font-size: 0.9375rem;
    text-decoration: none;
    width: fit-content;
}

.website-link:hover {
    text-decoration: underline;
}

.meta-row {
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
}

.meta-item {
    font-size: 0.875rem;
    color: var(--color-text-muted, #888);
}

/* Posts */
.posts-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.section-title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border, #2a2a2a);
}

.posts-feed {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.empty-posts {
    color: var(--color-text-muted, #888);
    font-size: 0.9375rem;
    padding: 2rem 0;
    text-align: center;
}

/* Buttons */
.btn {
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 700;
    padding: 0.4375rem 1rem;
    transition: opacity 0.15s;
    line-height: 1;
}

.btn-ghost {
    background: transparent;
    border: 1px solid var(--color-border, #555);
    color: var(--color-text, #fff);
}

.btn-ghost:hover {
    background: rgba(255, 255, 255, 0.06);
}
</style>

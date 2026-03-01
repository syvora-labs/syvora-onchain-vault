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
import { SyvoraAvatar, SyvoraEmptyState } from '@syvora/ui'

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
        <SyvoraEmptyState v-if="isLoading">Loading…</SyvoraEmptyState>

        <SyvoraEmptyState v-else-if="notFound">
            <p>User <strong>@{{ username }}</strong> not found.</p>
        </SyvoraEmptyState>

        <template v-else-if="profile">
            <!-- Profile header -->
            <div class="profile-header">
                <!-- Avatar + identity row -->
                <div class="avatar-row">
                    <SyvoraAvatar
                        :name="profile.username"
                        :src="profile.avatar_url"
                        size="lg"
                    />

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

                <SyvoraEmptyState v-if="userPosts.length === 0">No posts yet.</SyvoraEmptyState>

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

/* Header */
.profile-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
    margin-bottom: 1.5rem;
}

.avatar-row {
    display: flex;
    align-items: center;
    gap: 1rem;
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
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
}

.posts-feed {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

/* Buttons */
.btn {
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.4375rem 1.125rem;
    transition: background 0.15s, box-shadow 0.15s;
    line-height: 1;
}

.btn-ghost {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.52);
    color: var(--color-text);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8) inset, 0 1px 4px rgba(0,0,0,0.05);
}

.btn-ghost:hover {
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.95) inset, 0 2px 8px rgba(0,0,0,0.07);
}
</style>

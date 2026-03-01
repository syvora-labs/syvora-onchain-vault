<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { SyvoraModal, SyvoraAvatar, SyvoraTextarea, SyvoraFormField } from '@syvora/ui'

const emit = defineEmits<{ close: [] }>()

const { currentProfile, updateProfile, uploadAvatar } = useAuth()

const displayName = ref(currentProfile.value?.display_name ?? '')
const bio = ref(currentProfile.value?.bio ?? '')
const website = ref(currentProfile.value?.website ?? '')
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(currentProfile.value?.avatar_url ?? null)
const saving = ref(false)
const errorMsg = ref('')

const bioMax = 160

function handleFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    avatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file)
}

function triggerFileInput() {
    document.getElementById('avatar-input')?.click()
}

async function save() {
    saving.value = true
    errorMsg.value = ''
    try {
        let avatarUrl = currentProfile.value?.avatar_url ?? null
        if (avatarFile.value) {
            avatarUrl = await uploadAvatar(avatarFile.value)
        }
        await updateProfile({
            display_name: displayName.value.trim() || null,
            bio: bio.value.trim() || null,
            website: website.value.trim() || null,
            avatar_url: avatarUrl,
        })
        emit('close')
    } catch (e: unknown) {
        errorMsg.value = e instanceof Error ? e.message : 'Failed to save profile'
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <SyvoraModal title="Edit profile" @close="emit('close')">
        <!-- Avatar -->
        <div class="avatar-section">
            <SyvoraAvatar
                :name="currentProfile?.username ?? '?'"
                :src="avatarPreview"
                size="lg"
                editable
                @click="triggerFileInput"
            />
            <input
                id="avatar-input"
                type="file"
                accept="image/*"
                class="hidden-input"
                @change="handleFileChange"
            />
        </div>

        <!-- Display name -->
        <SyvoraFormField label="Display name" for="display-name">
            <input
                id="display-name"
                v-model="displayName"
                type="text"
                class="field-input"
                placeholder="Your name"
                maxlength="50"
            />
        </SyvoraFormField>

        <!-- Bio -->
        <SyvoraFormField label="Bio" for="bio" :char-count="bio.length" :max-chars="bioMax">
            <SyvoraTextarea
                id="bio"
                v-model="bio"
                placeholder="Tell the world about yourself"
                :maxlength="bioMax"
                :rows="3"
            />
        </SyvoraFormField>

        <!-- Website -->
        <SyvoraFormField label="Website" for="website">
            <input
                id="website"
                v-model="website"
                type="url"
                class="field-input"
                placeholder="https://yoursite.com"
                maxlength="200"
            />
        </SyvoraFormField>

        <div v-if="errorMsg" class="error-box">{{ errorMsg }}</div>

        <template #footer>
            <button class="btn btn-ghost" @click="emit('close')">Cancel</button>
            <button class="btn btn-primary" :disabled="saving" @click="save">
                {{ saving ? 'Saving…' : 'Save' }}
            </button>
        </template>
    </SyvoraModal>
</template>

<style scoped>
.avatar-section {
    display: flex;
    justify-content: center;
}

.hidden-input {
    display: none;
}

.field-input {
    background: var(--color-bg, #121212);
    border: 1px solid var(--color-border, #2a2a2a);
    border-radius: 0.5rem;
    color: var(--color-text, #fff);
    font-family: inherit;
    font-size: 0.9375rem;
    padding: 0.625rem 0.75rem;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
    box-sizing: border-box;
}

.field-input:focus {
    border-color: var(--color-accent, #4ade80);
}

.field-input::placeholder {
    color: var(--color-text-muted, #666);
}

.error-box {
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid rgba(220, 38, 38, 0.3);
    border-radius: 0.5rem;
    color: #f87171;
    font-size: 0.875rem;
    padding: 0.625rem 0.75rem;
}

.btn {
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.5rem 1.25rem;
    transition: opacity 0.15s;
    line-height: 1;
}

.btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.btn-primary {
    background: var(--color-accent, #4ade80);
    color: #000;
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
</style>

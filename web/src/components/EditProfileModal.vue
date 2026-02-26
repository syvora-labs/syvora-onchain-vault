<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

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
    <div class="modal-overlay" @click.self="emit('close')">
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">Edit profile</h2>
                <button class="close-btn" @click="emit('close')">✕</button>
            </div>

            <div class="modal-body">
                <!-- Avatar -->
                <div class="avatar-section">
                    <div class="avatar-preview" @click="triggerFileInput">
                        <img v-if="avatarPreview" :src="avatarPreview" alt="avatar" class="avatar-img" />
                        <span v-else class="avatar-placeholder">
                            {{ (currentProfile?.username ?? '?').charAt(0).toUpperCase() }}
                        </span>
                        <div class="avatar-overlay">Change</div>
                    </div>
                    <input
                        id="avatar-input"
                        type="file"
                        accept="image/*"
                        class="hidden-input"
                        @change="handleFileChange"
                    />
                </div>

                <!-- Display name -->
                <div class="field">
                    <label class="field-label" for="display-name">Display name</label>
                    <input
                        id="display-name"
                        v-model="displayName"
                        type="text"
                        class="field-input"
                        placeholder="Your name"
                        maxlength="50"
                    />
                </div>

                <!-- Bio -->
                <div class="field">
                    <label class="field-label" for="bio">
                        Bio
                        <span class="char-count" :class="{ warn: bio.length > 140 }">
                            {{ bio.length }}/{{ bioMax }}
                        </span>
                    </label>
                    <textarea
                        id="bio"
                        v-model="bio"
                        class="field-input field-textarea"
                        placeholder="Tell the world about yourself"
                        :maxlength="bioMax"
                        rows="3"
                    />
                </div>

                <!-- Website -->
                <div class="field">
                    <label class="field-label" for="website">Website</label>
                    <input
                        id="website"
                        v-model="website"
                        type="url"
                        class="field-input"
                        placeholder="https://yoursite.com"
                        maxlength="200"
                    />
                </div>

                <div v-if="errorMsg" class="error-box">{{ errorMsg }}</div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-ghost" @click="emit('close')">Cancel</button>
                <button class="btn btn-primary" :disabled="saving" @click="save">
                    {{ saving ? 'Saving…' : 'Save' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
}

.modal {
    background: var(--color-surface, #1e1e1e);
    border: 1px solid var(--color-border, #2a2a2a);
    border-radius: 1rem;
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    overflow: hidden;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--color-border, #2a2a2a);
    flex-shrink: 0;
}

.modal-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    color: var(--color-text-muted, #aaa);
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem;
    line-height: 1;
}

.close-btn:hover {
    color: var(--color-text, #fff);
}

.modal-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    overflow-y: auto;
}

.avatar-section {
    display: flex;
    justify-content: center;
}

.avatar-preview {
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    background: var(--color-accent, #4ade80);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    border: 3px solid var(--color-border, #2a2a2a);
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-placeholder {
    font-size: 1.75rem;
    font-weight: 700;
    color: #fff;
}

.avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #fff;
    transition: opacity 0.15s;
}

.avatar-preview:hover .avatar-overlay {
    opacity: 1;
}

.hidden-input {
    display: none;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.field-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-muted, #aaa);
}

.char-count {
    font-weight: 400;
}

.char-count.warn {
    color: #f59e0b;
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

.field-textarea {
    resize: none;
    line-height: 1.5;
}

.error-box {
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid rgba(220, 38, 38, 0.3);
    border-radius: 0.5rem;
    color: #f87171;
    font-size: 0.875rem;
    padding: 0.625rem 0.75rem;
}

.modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.625rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--color-border, #2a2a2a);
    flex-shrink: 0;
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

<script setup lang="ts">
defineProps<{
    modelValue: string
    placeholder?: string
    rows?: number
    maxlength?: number
    disabled?: boolean
    error?: string
    showCount?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
    <div class="syvora-textarea-wrap">
        <textarea
            class="syvora-textarea"
            :class="{ 'syvora-textarea--error': error }"
            :value="modelValue"
            :placeholder="placeholder"
            :rows="rows ?? 3"
            :maxlength="maxlength"
            :disabled="disabled"
            @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        />
        <div v-if="showCount && maxlength !== undefined" class="syvora-textarea-count">
            <span :class="{ warn: modelValue.length > maxlength * 0.875 }">
                {{ modelValue.length }}/{{ maxlength }}
            </span>
        </div>
        <p v-if="error" class="syvora-textarea-error">{{ error }}</p>
    </div>
</template>

<style scoped>
.syvora-textarea-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.syvora-textarea {
    width: 100%;
    background: rgba(255, 255, 255, 0.58);
    backdrop-filter: blur(10px) saturate(160%);
    -webkit-backdrop-filter: blur(10px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.52);
    border-radius: var(--radius-sm, 0.625rem);
    color: var(--color-text, #0a1a12);
    font-family: inherit;
    font-size: 0.9375rem;
    padding: 0.625rem 0.875rem;
    outline: none;
    resize: none;
    line-height: 1.5;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    box-sizing: border-box;
    box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.85) inset,
        0 1px 3px rgba(0, 0, 0, 0.04) inset;
}

.syvora-textarea:focus {
    background: rgba(255, 255, 255, 0.72);
    border-color: rgba(22, 163, 74, 0.4);
    box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.95) inset,
        0 1px 3px rgba(0, 0, 0, 0.04) inset,
        0 0 0 3px rgba(22, 163, 74, 0.1);
}

.syvora-textarea::placeholder {
    color: rgba(10, 26, 18, 0.38);
}

.syvora-textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.syvora-textarea--error {
    border-color: var(--color-error, #dc2626);
}

.syvora-textarea-count {
    text-align: right;
    font-size: 0.8125rem;
    color: var(--color-text-muted, #888);
}

.syvora-textarea-count .warn {
    color: #f59e0b;
}

.syvora-textarea-error {
    font-size: 0.875rem;
    color: var(--color-error, #f87171);
    margin: 0;
}
</style>

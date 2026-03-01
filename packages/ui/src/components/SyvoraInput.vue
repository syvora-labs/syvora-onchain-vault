<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{
    modelValue: string
    placeholder?: string
    suffix?: string
    disabled?: boolean
    error?: string
}>()

defineEmits<{
    'update:modelValue': [value: string]
}>()
</script>

<template>
    <div class="syvora-input-wrap">
        <div class="syvora-input-group">
            <input
                class="syvora-input"
                :class="{ 'syvora-input--error': error }"
                v-bind="$attrs"
                :value="modelValue"
                :placeholder="placeholder"
                :disabled="disabled"
                @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
            />
            <span v-if="suffix" class="syvora-input-suffix">{{ suffix }}</span>
        </div>
        <p v-if="error" class="error-msg mt-sm">{{ error }}</p>
    </div>
</template>

<style scoped>
.syvora-input-wrap {
    display: flex;
    flex-direction: column;
}

.syvora-input-group {
    position: relative;
}

.syvora-input {
    width: 100%;
    padding: 0.75rem 3.5rem 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.58);
    backdrop-filter: blur(10px) saturate(160%);
    -webkit-backdrop-filter: blur(10px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.52);
    border-radius: var(--radius-sm, 0.625rem);
    color: var(--color-text);
    font-size: 1rem;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.85) inset,
        0 1px 3px rgba(0, 0, 0, 0.04) inset;
}

.syvora-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.72);
    border-color: rgba(22, 163, 74, 0.4);
    box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.95) inset,
        0 1px 3px rgba(0, 0, 0, 0.04) inset,
        0 0 0 3px rgba(22, 163, 74, 0.1);
}

.syvora-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.syvora-input::-webkit-outer-spin-button,
.syvora-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
}

.syvora-input--error {
    border-color: var(--color-error);
}

.syvora-input-suffix {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-muted);
    font-size: 0.875rem;
    pointer-events: none;
}
</style>

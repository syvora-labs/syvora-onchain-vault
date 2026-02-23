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
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    color: var(--color-text);
    font-size: 1rem;
    box-sizing: border-box;
    transition: border-color 0.2s;
}

.syvora-input:focus {
    outline: none;
    border-color: var(--color-accent);
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

<script setup lang="ts">
defineProps<{
    label: string
    for?: string
    charCount?: number
    maxChars?: number
}>()
</script>

<template>
    <div class="syvora-form-field">
        <label class="syvora-form-field-label" :for="for">
            <span>{{ label }}</span>
            <span
                v-if="charCount !== undefined && maxChars !== undefined"
                class="syvora-form-field-count"
                :class="{ warn: charCount > maxChars * 0.875 }"
            >
                {{ charCount }}/{{ maxChars }}
            </span>
        </label>
        <slot />
    </div>
</template>

<style scoped>
.syvora-form-field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.syvora-form-field-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-muted, #aaa);
}

.syvora-form-field-count {
    font-weight: 400;
}

.syvora-form-field-count.warn {
    color: #f59e0b;
}
</style>

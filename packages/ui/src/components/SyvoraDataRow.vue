<script setup lang="ts">
defineProps<{
    label: string
}>()
</script>

<template>
    <div class="data-row">
        <span class="data-label">{{ label }}</span>
        <span class="data-value">
            <slot />
        </span>
    </div>
</template>

<style scoped>
.data-row {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.data-label {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
}

.data-value {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--color-accent);
}
</style>

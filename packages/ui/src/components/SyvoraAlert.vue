<script setup lang="ts">
withDefaults(defineProps<{
    variant?: 'warning' | 'error' | 'info'
    dismissible?: boolean
}>(), {
    variant: 'info',
    dismissible: false,
})

defineEmits<{ dismiss: [] }>()
</script>

<template>
    <div class="syvora-alert" :class="`syvora-alert--${variant}`">
        <div class="syvora-alert-content">
            <slot />
        </div>
        <button
            v-if="dismissible"
            class="syvora-alert-dismiss"
            aria-label="Dismiss"
            @click="$emit('dismiss')"
        >✕</button>
    </div>
</template>

<style scoped>
.syvora-alert {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 0.75rem 1rem;
}

.syvora-alert--warning {
    background: #fef9ec;
    border-bottom: 1px solid #f0d060;
    color: #7a5800;
}

.syvora-alert--error {
    background: rgba(220, 38, 38, 0.08);
    border: 1px solid rgba(220, 38, 38, 0.2);
    border-radius: 0.5rem;
    color: var(--color-error);
    font-size: 0.875rem;
}

.syvora-alert--info {
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    color: var(--color-text);
}

.syvora-alert-content {
    flex: 1;
}

.syvora-alert-dismiss {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    color: inherit;
    padding: 0.1rem 0.25rem;
    line-height: 1;
    flex-shrink: 0;
    opacity: 0.6;
}

.syvora-alert-dismiss:hover {
    opacity: 1;
}
</style>

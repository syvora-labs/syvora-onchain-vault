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
    background: rgba(253, 245, 230, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(240, 180, 60, 0.4);
    color: #7a5800;
}

.syvora-alert--error {
    background: rgba(254, 242, 242, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(220, 38, 38, 0.2);
    border-radius: var(--radius-sm, 0.625rem);
    color: var(--color-error);
    font-size: 0.875rem;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset;
}

.syvora-alert--info {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: var(--radius-sm, 0.625rem);
    color: var(--color-text);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8) inset;
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

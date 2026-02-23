<script setup lang="ts">
const props = withDefaults(defineProps<{
    variant?: 'primary' | 'ghost'
    size?: 'sm' | 'md'
    full?: boolean
    loading?: boolean
    disabled?: boolean
}>(), {
    variant: 'primary',
    size: 'md',
    full: false,
    loading: false,
    disabled: false,
})
</script>

<template>
    <button
        class="btn"
        :class="[
            props.variant === 'ghost' ? 'btn-ghost' : 'btn-primary',
            props.size === 'sm' ? 'btn-sm' : '',
            props.full ? 'btn-full' : '',
        ]"
        :disabled="props.disabled || props.loading"
    >
        <slot />
    </button>
</template>

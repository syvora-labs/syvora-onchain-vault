<script setup lang="ts">
const props = withDefaults(defineProps<{
    variant?: 'success' | 'warning' | 'error' | 'muted' | 'deposit' | 'withdraw' | 'claim'
}>(), {
    variant: 'muted',
})

const classMap: Record<string, string> = {
    success:  'badge-success',
    warning:  'badge-warning',
    error:    'badge-error',
    muted:    '',
    deposit:  'badge-deposit',
    withdraw: 'badge-withdraw',
    claim:    'badge-claim',
}
</script>

<template>
    <span class="badge" :class="classMap[props.variant]">
        <slot />
    </span>
</template>

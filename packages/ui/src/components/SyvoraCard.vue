<script setup lang="ts">
defineProps<{
    title?: string
}>()
</script>

<template>
    <div class="card">
        <slot name="header">
            <h2 v-if="title" class="card-title">{{ title }}</h2>
        </slot>
        <slot />
    </div>
</template>

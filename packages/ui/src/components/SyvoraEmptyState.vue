<script setup lang="ts">
</script>

<template>
    <div class="syvora-empty-state">
        <slot />
    </div>
</template>

<style scoped>
.syvora-empty-state {
    color: var(--color-text-muted, #888);
    font-size: 0.9375rem;
    padding: 2rem 0;
    text-align: center;
}
</style>

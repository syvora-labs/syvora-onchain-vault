<script setup lang="ts">
defineProps<{
    steps: string[]
    activeStep: number
}>()
</script>

<template>
    <div class="steps">
        <div
            v-for="(step, i) in steps"
            :key="i"
            class="step"
            :class="{ active: i === activeStep }"
        >
            <span class="step-number">{{ i + 1 }}</span>
            <span>{{ step }}</span>
        </div>
    </div>
</template>

<style scoped>
.steps {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.step {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: var(--color-text-muted);
    transition: color 0.2s;
}

.step.active {
    color: var(--color-accent);
    font-weight: 600;
}

.step-number {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    border: 1px solid currentColor;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    flex-shrink: 0;
}
</style>

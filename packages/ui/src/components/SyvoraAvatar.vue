<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    name: string
    src?: string | null
    size?: 'sm' | 'md' | 'lg'
    editable?: boolean
}>()

const emit = defineEmits<{ click: [] }>()

const initial = computed(() => (props.name || '?').charAt(0).toUpperCase())

const bg = computed(() => {
    let hash = 0
    for (const ch of props.name) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
    return `hsl(${Math.abs(hash) % 360}, 55%, 38%)`
})

const sizeClass = computed(() => `syvora-avatar--${props.size ?? 'md'}`)
</script>

<template>
    <div
        class="syvora-avatar"
        :class="[sizeClass, { 'syvora-avatar--editable': editable }]"
        :style="{ background: bg }"
        @click="editable ? emit('click') : undefined"
    >
        <img v-if="src" :src="src" :alt="name" class="syvora-avatar-img" />
        <span v-else class="syvora-avatar-initial">{{ initial }}</span>
        <div v-if="editable" class="syvora-avatar-overlay">Change</div>
    </div>
</template>

<style scoped>
.syvora-avatar {
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
}

.syvora-avatar--sm  { width: 2rem;  height: 2rem; }
.syvora-avatar--md  { width: 3rem;  height: 3rem; }
.syvora-avatar--lg  { width: 5rem;  height: 5rem; box-shadow: 0 0 0 2.5px rgba(255, 255, 255, 0.8), 0 2px 8px rgba(0,0,0,0.08); }

.syvora-avatar--editable {
    cursor: pointer;
}

.syvora-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.syvora-avatar-initial {
    color: #fff;
    font-weight: 700;
    line-height: 1;
}

.syvora-avatar--sm  .syvora-avatar-initial { font-size: 0.8125rem; }
.syvora-avatar--md  .syvora-avatar-initial { font-size: 1.125rem; }
.syvora-avatar--lg  .syvora-avatar-initial { font-size: 2rem; }

.syvora-avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #fff;
    transition: opacity 0.15s;
}

.syvora-avatar--editable:hover .syvora-avatar-overlay {
    opacity: 1;
}
</style>

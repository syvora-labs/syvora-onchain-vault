<script setup lang="ts">
// AppShell provides the full-page layout:
// sticky header (logo | nav | actions) → notice → main → footer
</script>

<template>
    <div class="shell">
        <header class="shell-header">
            <div class="shell-header-inner">
                <div class="shell-logo">
                    <slot name="logo" />
                </div>

                <div class="shell-nav">
                    <slot name="nav" />
                </div>

                <div class="shell-actions">
                    <slot name="actions" />
                </div>
            </div>
        </header>

        <div v-if="$slots.notice" class="shell-notice">
            <slot name="notice" />
        </div>

        <main class="shell-main">
            <slot />
        </main>

        <footer class="shell-footer">
            <slot name="footer" />
        </footer>
    </div>
</template>

<style scoped>
.shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.shell-header {
    position: sticky;
    top: 0;
    z-index: 100;
    padding: 0 1.5rem;
    height: 4rem;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow:
        0 1px 0 rgba(0, 0, 0, 0.05),
        0 4px 24px rgba(0, 0, 0, 0.04);
}

.shell-header-inner {
    max-width: 960px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.shell-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    font-size: 1.125rem;
    flex-shrink: 0;
}

:slotted(.logo-icon) {
    font-size: 1.4rem;
}

:slotted(.logo-text) {
    color: inherit;
    text-decoration: none;
}

.shell-nav {
    display: flex;
    gap: 1.25rem;
    flex: 1;
    padding-left: 1.5rem;
}

:slotted(.nav-link) {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(10, 26, 18, 0.5);
    text-decoration: none;
    padding: 0.25rem 0.625rem;
    border-radius: 0.5rem;
    transition: color 0.15s, background 0.15s;
}

:slotted(.nav-link:hover) {
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.5);
}

:slotted(.nav-link--active) {
    color: var(--color-accent);
    background: rgba(22, 163, 74, 0.08);
    font-weight: 600;
}

.shell-actions {
    flex-shrink: 0;
}

.shell-notice {
    /* full-width notice bar — SyvoraAlert handles its own background */
}

.shell-main {
    flex: 1;
    padding: 3rem 1.5rem 2rem;
}

.shell-footer {
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    padding: 1rem 1.5rem;
    text-align: center;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

:slotted(.footer a) {
    color: var(--color-accent);
    text-decoration: none;
}

@media (max-width: 600px) {
    .shell-header {
        height: auto;
        padding: 0.5rem 1rem;
    }

    .shell-header-inner {
        flex-wrap: wrap;
        row-gap: 0.25rem;
    }

    .shell-nav {
        order: 3;
        flex: 0 0 100%;
        padding-left: 0;
        padding-top: 0.5rem;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
    }

    .shell-main {
        padding: 1.5rem 1rem 1.5rem;
    }
}
</style>

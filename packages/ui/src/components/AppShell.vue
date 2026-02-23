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
    border-bottom: 1px solid var(--color-border);
    padding: 0 1.5rem;
    height: 4rem;
    display: flex;
    align-items: center;
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
    font-size: 0.9rem;
    color: var(--color-text-muted);
    text-decoration: none;
    padding-bottom: 2px;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
}

:slotted(.nav-link:hover) {
    color: var(--color-text);
}

:slotted(.nav-link--active) {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
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
    border-top: 1px solid var(--color-border);
    padding: 1rem 1.5rem;
    text-align: center;
    font-size: 0.8rem;
    color: var(--color-text-muted);
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
        border-top: 1px solid var(--color-border);
    }

    .shell-main {
        padding: 1.5rem 1rem 1.5rem;
    }
}
</style>

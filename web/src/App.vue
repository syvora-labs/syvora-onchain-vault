<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import WalletConnect from './components/WalletConnect.vue'
import { useWallet } from './composables/useWallet'
import { LOCAL_SETUP_NOTICE } from './contracts/addresses'

const { isConnected } = useWallet()

const noticeDismissed = ref(false)
</script>

<template>
    <div class="app">
        <header class="header">
            <div class="header-inner">
                <div class="logo">
                    <span class="logo-icon">🌿</span>
                    <RouterLink to="/" class="logo-text">Syvora Vault</RouterLink>
                </div>

                <nav v-if="isConnected" class="nav">
                    <RouterLink to="/" class="nav-link" active-class="nav-link--active" exact>Home</RouterLink>
                    <RouterLink to="/profile" class="nav-link" active-class="nav-link--active">Profile</RouterLink>
                </nav>

                <div class="wallet-wrapper">
                    <WalletConnect />
                </div>
            </div>
        </header>

        <div v-if="LOCAL_SETUP_NOTICE && !noticeDismissed" class="local-notice">
            <div class="local-notice-inner">
                <span class="local-notice-label">Local setup required</span>
                <p class="local-notice-text">
                    The contracts run on a local Anvil node. Start them with
                    <code>docker compose up</code>, then add
                    <code>http://localhost:8545</code> (Chain ID&nbsp;31337) as a network in MetaMask and connect.
                </p>
                <button class="local-notice-dismiss" @click="noticeDismissed = true" aria-label="Dismiss">✕</button>
            </div>
        </div>

        <main class="main">
            <RouterView />
        </main>

        <footer class="footer">
            <p>Powered by a local Anvil node via Docker Compose</p>
        </footer>
    </div>
</template>

<style scoped>
.app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.header {
    border-bottom: 1px solid var(--color-border);
    padding: 0 1.5rem;
    height: 4rem;
    display: flex;
    align-items: center;
}

.header-inner {
    max-width: 960px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    font-size: 1.125rem;
}

.logo-icon {
    font-size: 1.4rem;
}

.logo-text {
    color: inherit;
    text-decoration: none;
}

.nav {
    display: flex;
    gap: 1.25rem;
    flex: 1;
    padding-left: 1.5rem;
}

.nav-link {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    text-decoration: none;
    padding-bottom: 2px;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
}

.nav-link:hover {
    color: var(--color-text);
}

.nav-link--active {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
}

.local-notice {
    background: #fef9ec;
    border-bottom: 1px solid #f0d060;
    padding: 0.75rem 1.5rem;
}

.local-notice-inner {
    max-width: 960px;
    margin: 0 auto;
    display: flex;
    align-items: baseline;
    gap: 1rem;
}

.local-notice-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #a07000;
    white-space: nowrap;
    flex-shrink: 0;
}

.local-notice-text {
    font-size: 0.875rem;
    color: #7a5800;
    margin: 0;
}

.local-notice-text code {
    font-family: monospace;
    background: #faecc0;
    padding: 0.1em 0.35em;
    border-radius: 0.25rem;
    font-size: 0.85em;
}

.local-notice-dismiss {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    color: #a07000;
    padding: 0.1rem 0.25rem;
    line-height: 1;
    flex-shrink: 0;
    opacity: 0.6;
}

.local-notice-dismiss:hover {
    opacity: 1;
}

.main {
    flex: 1;
    padding: 3rem 1.5rem 2rem;
}

.footer {
    border-top: 1px solid var(--color-border);
    padding: 1rem 1.5rem;
    text-align: center;
    font-size: 0.8rem;
    color: var(--color-text-muted);
}

.footer a {
    color: var(--color-accent);
    text-decoration: none;
}

.wallet-wrapper {
    flex-shrink: 0;
}

@media (max-width: 600px) {
    .header {
        height: auto;
        padding: 0.5rem 1rem;
    }

    .header-inner {
        flex-wrap: wrap;
        row-gap: 0.25rem;
    }

    .nav {
        order: 3;
        flex: 0 0 100%;
        padding-left: 0;
        padding-top: 0.5rem;
        border-top: 1px solid var(--color-border);
    }

    .local-notice {
        padding: 0.75rem 1rem;
    }

    .local-notice-inner {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.35rem;
        position: relative;
        padding-right: 2rem;
    }

    .local-notice-dismiss {
        position: absolute;
        top: 0;
        right: 0;
    }

    .main {
        padding: 1.5rem 1rem 1.5rem;
    }
}
</style>

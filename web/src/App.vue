<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import WalletConnect from './components/WalletConnect.vue'
import { useWallet } from './composables/useWallet'

const { isConnected } = useWallet()
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

                <WalletConnect />
            </div>
        </header>

        <main class="main">
            <RouterView />
        </main>

        <footer class="footer">
            <p>
                Deployed on
                <a href="https://sepolia.etherscan.io" target="_blank" rel="noopener">Sepolia testnet</a>
            </p>
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
</style>

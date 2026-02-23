<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import WalletConnect from './components/WalletConnect.vue'
import { useWallet } from './composables/useWallet'
import { LOCAL_SETUP_NOTICE } from './contracts/addresses'
import { AppShell, SyvoraAlert } from '@syvora/ui'

const { isConnected } = useWallet()

const noticeDismissed = ref(false)
</script>

<template>
    <AppShell>
        <template #logo>
            <span class="logo-icon">🌿</span>
            <RouterLink to="/" class="logo-text">Syvora Vault</RouterLink>
        </template>

        <template #nav>
            <RouterLink to="/forum" class="nav-link" active-class="nav-link--active">Forum</RouterLink>
            <template v-if="isConnected">
                <RouterLink to="/" class="nav-link" active-class="nav-link--active" exact>Home</RouterLink>
                <RouterLink to="/profile" class="nav-link" active-class="nav-link--active">Profile</RouterLink>
            </template>
        </template>

        <template #actions>
            <WalletConnect />
        </template>

        <template #notice>
            <SyvoraAlert
                v-if="LOCAL_SETUP_NOTICE && !noticeDismissed"
                variant="warning"
                dismissible
                @dismiss="noticeDismissed = true"
            >
                <div class="notice-inner">
                    <span class="notice-label">Local setup required</span>
                    <p class="notice-text">
                        The contracts run on a local Anvil node. Start them with
                        <code>docker compose up</code>, then add
                        <code>http://localhost:8545</code> (Chain ID&nbsp;31337) as a network in MetaMask and connect.
                    </p>
                </div>
            </SyvoraAlert>
        </template>

        <RouterView />

        <template #footer>
            <p>Powered by a local Anvil node via Docker Compose</p>
        </template>
    </AppShell>
</template>

<style scoped>
.notice-inner {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    max-width: 960px;
    margin: 0 auto;
}

.notice-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #a07000;
    white-space: nowrap;
    flex-shrink: 0;
}

.notice-text {
    font-size: 0.875rem;
    color: #7a5800;
    margin: 0;
}

.notice-text code {
    font-family: monospace;
    background: #faecc0;
    padding: 0.1em 0.35em;
    border-radius: 0.25rem;
    font-size: 0.85em;
}

@media (max-width: 600px) {
    .notice-inner {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.35rem;
    }
}
</style>

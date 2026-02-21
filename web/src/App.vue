<script setup lang="ts">
import { ref } from 'vue'
import WalletConnect from './components/WalletConnect.vue'
import TokenBalance  from './components/TokenBalance.vue'
import DepositForm   from './components/DepositForm.vue'
import VaultPosition from './components/VaultPosition.vue'

const tokenBalanceRef  = ref<InstanceType<typeof TokenBalance> | null>(null)
const vaultPositionRef = ref<InstanceType<typeof VaultPosition> | null>(null)

function onWalletConnected() {
  tokenBalanceRef.value?.refresh()
  vaultPositionRef.value?.refresh()
}

function onDeposited() {
  tokenBalanceRef.value?.refresh()
  vaultPositionRef.value?.refresh()
}
</script>

<template>
  <div class="app">
    <!-- ── Header ── -->
    <header class="header">
      <div class="header-inner">
        <div class="logo">
          <span class="logo-icon">🌿</span>
          <span class="logo-text">Syvora Vault</span>
        </div>
        <WalletConnect @connected="onWalletConnected" />
      </div>
    </header>

    <!-- ── Main ── -->
    <main class="main">
      <div class="content">
        <!-- Hero: big balance display -->
        <div class="hero">
          <TokenBalance ref="tokenBalanceRef" />
        </div>

        <!-- Actions: deposit + vault side by side -->
        <div class="actions">
          <DepositForm @deposited="onDeposited" />
          <VaultPosition ref="vaultPositionRef" />
        </div>
      </div>
    </main>

    <!-- ── Footer ── -->
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

/* ── Header ── */
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
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.125rem;
}

.logo-icon { font-size: 1.4rem; }

/* ── Main ── */
.main {
  flex: 1;
  padding: 3rem 1.5rem 2rem;
}

.content {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

/* ── Actions grid ── */
.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 640px) {
  .actions { grid-template-columns: 1fr; }
}

/* ── Footer ── */
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

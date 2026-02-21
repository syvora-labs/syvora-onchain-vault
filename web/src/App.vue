<script setup lang="ts">
/**
 * App.vue — root component and layout.
 *
 * Orchestrates the child components:
 *  - WalletConnect  (header right)
 *  - TokenBalance   (card)
 *  - DepositForm    (card)
 *  - VaultPosition  (card)
 *
 * When the wallet connects or a transaction completes, we call refresh() on
 * the relevant child components via template refs so their data stays current.
 */
import { ref } from 'vue'
import WalletConnect from './components/WalletConnect.vue'
import TokenBalance  from './components/TokenBalance.vue'
import DepositForm   from './components/DepositForm.vue'
import VaultPosition from './components/VaultPosition.vue'

// Template refs let us call methods exposed by child components
const tokenBalanceRef  = ref<InstanceType<typeof TokenBalance> | null>(null)
const vaultPositionRef = ref<InstanceType<typeof VaultPosition> | null>(null)

/** Called when the wallet connects — refresh all on-chain data. */
function onWalletConnected() {
  tokenBalanceRef.value?.refresh()
  vaultPositionRef.value?.refresh()
}

/** Called after a deposit — update both the balance and the vault position. */
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
          <span class="logo-icon">⬡</span>
          <span class="logo-text">Syvora Vault</span>
        </div>
        <WalletConnect @connected="onWalletConnected" />
      </div>
    </header>

    <!-- ── Main content ── -->
    <main class="main">
      <div class="grid">
        <TokenBalance ref="tokenBalanceRef" />
        <DepositForm @deposited="onDeposited" />
        <VaultPosition ref="vaultPositionRef" />
      </div>
    </main>

    <!-- ── Footer ── -->
    <footer class="footer">
      <p>
        Learning project — deployed on
        <a href="https://sepolia.etherscan.io" target="_blank" rel="noopener">
          Sepolia testnet
        </a>
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

.logo-icon {
  font-size: 1.5rem;
  color: var(--color-accent);
}

/* ── Main ── */
.main {
  flex: 1;
  padding: 2rem 1.5rem;
}

.grid {
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  align-items: start;
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

/**
 * useWallet — manages the MetaMask connection.
 *
 * This composable uses the "module-level state" pattern: the reactive refs are
 * declared OUTSIDE the function, so they are shared across every component that
 * calls useWallet(). Think of it as a lightweight global store for wallet state.
 *
 * ethers v6 key classes used here:
 *  - BrowserProvider  wraps window.ethereum and exposes the eth_ JSON-RPC API
 *  - JsonRpcSigner    an account that can sign transactions
 */
import { ref, computed } from 'vue'
import { BrowserProvider, JsonRpcSigner } from 'ethers'
import { REQUIRED_CHAIN_ID, REQUIRED_NETWORK_NAME } from '../contracts/addresses'

// ── Module-level shared state ────────────────────────────────────────────────
// These refs persist between component mounts/unmounts because they live
// outside any Vue component lifecycle.
const address  = ref<string | null>(null)
const signer   = ref<JsonRpcSigner | null>(null)
const provider = ref<BrowserProvider | null>(null)
const chainId  = ref<number | null>(null)

// ── Event listeners (set up once at module load) ─────────────────────────────
// MetaMask fires these events when the user switches account or network.
// The EthereumProvider.on callback uses (...args: unknown[]) so we cast inside.
if (window.ethereum) {
  window.ethereum.on('accountsChanged', (...args: unknown[]) => {
    const list = args[0] as string[]
    if (list.length === 0) {
      // User disconnected — clear state
      address.value  = null
      signer.value   = null
      provider.value = null
    } else {
      address.value = list[0] ?? null
    }
  })

  // Safest approach on chain switch is a full page reload so all state is fresh.
  window.ethereum.on('chainChanged', () => window.location.reload())
}

// ── Composable ───────────────────────────────────────────────────────────────
export function useWallet() {
  const isConnected = computed(() => address.value !== null)

  const isWrongNetwork = computed(
    () => chainId.value !== null && chainId.value !== REQUIRED_CHAIN_ID
  )

  /**
   * Ask MetaMask to show the connect dialog and request account access.
   * Updates module-level state on success.
   */
  async function connect(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please add it to your browser.')
    }

    const _provider = new BrowserProvider(window.ethereum)

    // eth_requestAccounts — pops the MetaMask "connect" dialog if not already connected
    const accounts = (await _provider.send('eth_requestAccounts', [])) as string[]

    // Read which chain MetaMask is on
    const network = await _provider.getNetwork()
    chainId.value = Number(network.chainId)

    if (chainId.value !== REQUIRED_CHAIN_ID) {
      throw new Error(
        `Wrong network. Please switch MetaMask to ${REQUIRED_NETWORK_NAME} (chain ${REQUIRED_CHAIN_ID}).`
      )
    }

    // getSigner() returns an object that signs transactions with the connected account
    const _signer = await _provider.getSigner()

    provider.value = _provider
    signer.value   = _signer
    address.value  = accounts[0] ?? null
  }

  /** Clear all wallet state (does not ask MetaMask to "disconnect" — that isn't possible). */
  function disconnect(): void {
    address.value  = null
    signer.value   = null
    provider.value = null
    chainId.value  = null
  }

  return {
    address,
    signer,
    provider,
    chainId,
    isConnected,
    isWrongNetwork,
    connect,
    disconnect,
  }
}

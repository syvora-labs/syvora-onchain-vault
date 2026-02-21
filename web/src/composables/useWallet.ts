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
import { ref, shallowRef, computed } from 'vue'
import { BrowserProvider, JsonRpcSigner } from 'ethers'
import { REQUIRED_CHAIN_ID } from '../contracts/addresses'

// ── Module-level shared state ────────────────────────────────────────────────
// These refs persist between component mounts/unmounts because they live
// outside any Vue component lifecycle.
//
// signer and provider use shallowRef instead of ref: ethers v6 uses private
// class fields (#field) internally. Vue's deep ref proxy makes `this` inside
// ethers methods point to the Proxy rather than the real instance, breaking
// private field access. shallowRef keeps the object un-proxied.
const address  = ref<string | null>(null)
const signer   = shallowRef<JsonRpcSigner | null>(null)
const provider = shallowRef<BrowserProvider | null>(null)
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
      // Ask MetaMask to switch automatically rather than just throwing.
      // wallet_switchEthereumChain takes the chain ID as a 0x-prefixed hex string.
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}` }],
      })
      // The chainChanged event will fire and reload the page, so we stop here.
      return
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

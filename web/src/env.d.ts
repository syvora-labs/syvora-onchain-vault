/// <reference types="vite/client" />

/**
 * Global type augmentations.
 *
 * Because this file has no top-level import/export statements, TypeScript
 * treats it as a "script" (ambient declaration file) and merges the interface
 * declarations below into the global scope automatically.
 */

/** Minimal shape of the EIP-1193 provider injected by MetaMask. */
interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>
  on(event: string, callback: (...args: unknown[]) => void): void
  removeListener(event: string, callback: (...args: unknown[]) => void): void
  isMetaMask?: boolean
}

/** Extend the browser Window type so we can use window.ethereum safely. */
interface Window {
  ethereum?: EthereumProvider
}

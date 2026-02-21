/**
 * Deployed contract addresses per network.
 *
 * Fill these in after running:
 *   forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
 *
 * The deploy script will print the addresses to the console.
 */
export const ADDRESSES = {
  sepolia: {
    syvoraToken: '0x0000000000000000000000000000000000000000', // TODO: fill after deploy
    vault:       '0x0000000000000000000000000000000000000000', // TODO: fill after deploy
  },
} as const

/** Sepolia chain ID — used to verify the user is on the right network. */
export const REQUIRED_CHAIN_ID = 11155111

/** Human-readable network name shown in error messages. */
export const REQUIRED_NETWORK_NAME = 'Sepolia'

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// Script is Foundry's base contract for deployment scripts.
// It provides the vm cheatcodes (vm.startBroadcast, etc.) and console logging.
import "forge-std/Script.sol";
import "../src/SyvoraToken.sol";
import "../src/Vault.sol";

/**
 * @title  Deploy
 * @notice Foundry deployment script for SyvoraToken and Vault.
 *
 * How it works:
 *  - Everything between vm.startBroadcast() and vm.stopBroadcast() is sent
 *    as real transactions to the network (or recorded for --broadcast).
 *  - Outside those calls, code runs only locally (off-chain simulation).
 *
 * Usage (from the contracts/ directory):
 *
 *   # 1. Copy and fill in the env file
 *   cp ../.env.example ../.env
 *   # edit .env with your PRIVATE_KEY, SEPOLIA_RPC_URL, ETHERSCAN_API_KEY
 *
 *   # 2. Dry-run (simulate locally, no transactions sent)
 *   forge script script/Deploy.s.sol --rpc-url sepolia
 *
 *   # 3. Broadcast (send real transactions to Sepolia)
 *   forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
 *
 *   # 4. Copy the printed addresses into web/src/contracts/addresses.ts
 *
 * The --verify flag automatically submits the source code to Etherscan
 * so anyone can read and verify the contract logic on-chain.
 */
contract Deploy is Script {
    function run() external {
        // msg.sender is automatically set to whichever address is broadcasting:
        //  - Local:   the address derived from --private-key on the CLI
        //  - Sepolia: the address derived from PRIVATE_KEY in .env
        // No env variable needed — works for both local and testnet deploys.
        address deployer = msg.sender;

        // Log so we can confirm the right wallet is being used before signing.
        console.log("Deploying from:    ", deployer);
        console.log("Chain ID:          ", block.chainid);
        console.log("---");

        // ── Start recording transactions ─────────────────────────────────────
        // vm.startBroadcast() with no arguments uses whatever key was supplied:
        //  - via --private-key on the CLI, or
        //  - via PRIVATE_KEY in .env (loaded automatically by Foundry)
        vm.startBroadcast();

        // 1. Deploy SyvoraToken
        //    Pass `deployer` as the initial owner so the correct wallet
        //    receives the 1,000,000 LRN initial mint and minting rights.
        SyvoraToken token = new SyvoraToken(deployer);
        console.log("SyvoraToken:       ", address(token));

        // 2. Deploy Vault, pointing it at the token we just deployed.
        Vault vault = new Vault(address(token));
        console.log("Vault:             ", address(vault));

        vm.stopBroadcast();
        // ── Transactions complete ─────────────────────────────────────────────

        console.log("---");
        console.log("Copy these into web/src/contracts/addresses.ts:");
        console.log("  syvoraToken: '", address(token), "'");
        console.log("  vault:       '", address(vault), "'");
    }
}

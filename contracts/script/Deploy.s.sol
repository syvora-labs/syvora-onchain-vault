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
        // vm.envAddress reads an environment variable and casts it to address.
        // If the variable is missing the script aborts with a clear error.
        // Alternatively, pass --sender <addr> to override on the CLI.
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");

        // Log so we can confirm the right wallet is being used before signing.
        console.log("Deploying from:    ", deployer);
        console.log("Chain ID:          ", block.chainid);
        console.log("---");

        // ── Start recording transactions ─────────────────────────────────────
        // vm.startBroadcast(pk) signs all subsequent transactions with the
        // private key stored in the PRIVATE_KEY env variable.
        // The deployer address is derived from that key automatically.
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

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

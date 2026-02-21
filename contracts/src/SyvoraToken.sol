// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// OpenZeppelin's ERC-20 implementation handles all standard token logic for us:
// balances, transfers, allowances, events (Transfer, Approval), etc.
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Ownable restricts certain functions (like minting) to the contract owner.
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  SyvoraToken
 * @notice A simple ERC-20 token used for learning purposes.
 *
 * Key concepts demonstrated:
 *  - Inheriting from OpenZeppelin's battle-tested ERC20 base contract
 *  - Using Ownable to gate privileged actions (minting)
 *  - The `18 decimals` default: 1 LRN = 1_000_000_000_000_000_000 (1e18) smallest units
 *
 * Target network: Sepolia testnet
 */
contract SyvoraToken is ERC20, Ownable {
    // ── Constructor ────────────────────────────────────────────────────────────

    /**
     * @dev Sets the token name and symbol, and mints an initial supply to the
     *      deployer so they have tokens to work with right away.
     *
     * @param initialOwner  Address that will own the contract (receives minting rights).
     *                      Typically msg.sender when deploying via a script.
     */
    constructor(address initialOwner)
        ERC20("SyvoraToken", "LRN")   // name, symbol passed to the ERC20 parent
        Ownable(initialOwner)         // owner passed to the Ownable parent
    {
        // Mint 1,000,000 LRN to the deployer as a starting supply.
        // `decimals()` returns 18 by default, so we use 10**decimals() as
        // the multiplier to express whole tokens.
        _mint(initialOwner, 1_000_000 * 10 ** decimals());
    }

    // ── Owner-only actions ─────────────────────────────────────────────────────

    /**
     * @notice Mint additional LRN tokens to any address.
     * @dev    Only the contract owner can call this function (enforced by the
     *         `onlyOwner` modifier from Ownable).
     *
     * @param to     Recipient of the newly minted tokens.
     * @param amount Amount of tokens to mint (in smallest units, i.e. wei).
     *               Example: to mint 100 LRN pass `100 * 1e18`.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

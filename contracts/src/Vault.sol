// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// IERC20 is the standard interface for ERC-20 tokens.
// We use it here so the Vault can work with any ERC-20, not just SyvoraToken.
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ReentrancyGuard protects the withdraw function from reentrancy attacks —
// a classic smart contract vulnerability where a malicious contract tries to
// call back into our contract before the first execution is finished.
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title  Vault
 * @notice A time-locked vault where users can deposit LRN tokens.
 *         Deposits are locked for 7 days before they can be withdrawn.
 *
 * Key concepts demonstrated:
 *  - Receiving ERC-20 tokens via transferFrom (requires prior approval)
 *  - Tracking per-user state with a mapping to a struct
 *  - Time-locking logic using block.timestamp
 *  - Emitting events so off-chain apps can react to on-chain actions
 *  - Reentrancy protection with OpenZeppelin's ReentrancyGuard
 *
 * Deposit flow:
 *  1. User calls token.approve(vaultAddress, amount)  ← on the token contract
 *  2. User calls vault.deposit(amount)                ← on this contract
 *
 * Withdraw flow:
 *  1. At least 7 days after deposit, user calls vault.withdraw()
 *
 * Target network: Sepolia testnet
 */
contract Vault is ReentrancyGuard {
    // ── Constants ──────────────────────────────────────────────────────────────

    /// @notice How long tokens are locked after a deposit.
    uint256 public constant LOCK_DURATION = 7 days;

    // ── State variables ────────────────────────────────────────────────────────

    /// @notice The ERC-20 token this vault accepts (SyvoraToken / LRN).
    ///         Immutable means it is set once in the constructor and never changes.
    IERC20 public immutable token;

    /**
     * @notice Stores each user's vault position.
     * @dev    `amount`    — how many tokens they have locked
     *         `unlocksAt` — the Unix timestamp when they may withdraw
     */
    struct Position {
        uint256 amount;
        uint256 unlocksAt;
    }

    /// @notice Maps each depositor address to their current vault position.
    mapping(address => Position) public positions;

    // ── Events ─────────────────────────────────────────────────────────────────

    /**
     * @notice Emitted when a user deposits tokens into the vault.
     * @param user      The depositor's address.
     * @param amount    How many tokens were deposited.
     * @param unlocksAt Unix timestamp when the tokens unlock.
     */
    event Deposited(address indexed user, uint256 amount, uint256 unlocksAt);

    /**
     * @notice Emitted when a user successfully withdraws their tokens.
     * @param user   The withdrawer's address.
     * @param amount How many tokens were returned.
     */
    event Withdrawn(address indexed user, uint256 amount);

    // ── Errors ─────────────────────────────────────────────────────────────────
    // Custom errors (introduced in Solidity 0.8.4) are cheaper than require()
    // strings because they don't store the string in bytecode.

    /// @dev Thrown when a deposit of zero tokens is attempted.
    error ZeroAmount();

    /// @dev Thrown when the user has no tokens deposited.
    error NothingDeposited();

    /// @dev Thrown when the lock period has not yet elapsed.
    /// @param unlocksAt The timestamp when the deposit unlocks.
    error StillLocked(uint256 unlocksAt);

    // ── Constructor ────────────────────────────────────────────────────────────

    /**
     * @param tokenAddress Address of the SyvoraToken (LRN) ERC-20 contract.
     */
    constructor(address tokenAddress) {
        token = IERC20(tokenAddress);
    }

    // ── External functions ─────────────────────────────────────────────────────

    /**
     * @notice Deposit LRN tokens into the vault.
     *
     * @dev    Before calling this function the user must have called
     *         `token.approve(address(this), amount)` so the vault is
     *         authorised to pull the tokens from their wallet.
     *
     *         If the user already has a locked position, the new deposit is
     *         added on top and the lock timer resets from now.
     *
     * @param amount Number of LRN tokens to deposit (in smallest units, 1e18 per token).
     */
    function deposit(uint256 amount) external nonReentrant {
        // Reject zero-value deposits immediately.
        if (amount == 0) revert ZeroAmount();

        // Calculate when these tokens will unlock.
        uint256 unlocksAt = block.timestamp + LOCK_DURATION;

        // Update the user's position in storage BEFORE transferring tokens
        // (checks-effects-interactions pattern — prevents reentrancy issues).
        Position storage pos = positions[msg.sender];
        pos.amount    += amount;
        pos.unlocksAt  = unlocksAt; // reset lock on top-up

        // Pull the tokens from the caller into this contract.
        // transferFrom will revert if the allowance is insufficient.
        token.transferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount, unlocksAt);
    }

    /**
     * @notice Withdraw all deposited LRN tokens after the lock period expires.
     *
     * @dev    Uses the nonReentrant modifier to prevent reentrancy attacks.
     *         The entire position is withdrawn in one go (no partial withdrawals).
     */
    function withdraw() external nonReentrant {
        Position storage pos = positions[msg.sender];

        // Must have something deposited.
        if (pos.amount == 0) revert NothingDeposited();

        // Must wait for the lock to expire.
        if (block.timestamp < pos.unlocksAt) revert StillLocked(pos.unlocksAt);

        // Cache amount before clearing (checks-effects-interactions pattern).
        uint256 amount = pos.amount;

        // Clear the position BEFORE transferring (prevents reentrancy).
        pos.amount    = 0;
        pos.unlocksAt = 0;

        // Send the tokens back to the user.
        token.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    // ── View functions ─────────────────────────────────────────────────────────

    /**
     * @notice Returns the deposited amount and unlock timestamp for a given user.
     * @param user Address to query.
     * @return amount    Tokens currently locked.
     * @return unlocksAt Unix timestamp when they unlock (0 if nothing deposited).
     */
    function getPosition(address user)
        external
        view
        returns (uint256 amount, uint256 unlocksAt)
    {
        Position storage pos = positions[user];
        return (pos.amount, pos.unlocksAt);
    }
}

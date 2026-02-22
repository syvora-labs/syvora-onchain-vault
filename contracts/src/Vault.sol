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
 *         Depositors earn 5% APY in rewards claimable at any time.
 *
 * Key concepts demonstrated:
 *  - Receiving ERC-20 tokens via transferFrom (requires prior approval)
 *  - Tracking per-user state with a mapping to a struct
 *  - Time-locking logic using block.timestamp
 *  - Continuous reward accrual via elapsed-time arithmetic
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
 * Reward flow:
 *  1. Owner funds the reward pool via fundRewardPool()
 *  2. User calls claimRewards() to collect accumulated yield
 *
 * Target network: Sepolia testnet
 */
contract Vault is ReentrancyGuard {
    // ── Constants ──────────────────────────────────────────────────────────────

    /// @notice How long tokens are locked after a deposit.
    uint256 public constant LOCK_DURATION = 7 days;

    /// @notice Reward rate equivalent to ~5% APY, expressed per second with 1e18 precision.
    ///         Derivation: 0.05 / 365.25 / 86400 * 1e18 ≈ 1_585_489_599
    uint256 public constant REWARD_RATE_PER_SECOND = 1_585_489_599;

    // ── State variables ────────────────────────────────────────────────────────

    /// @notice The ERC-20 token this vault accepts (SyvoraToken / LRN).
    ///         Immutable means it is set once in the constructor and never changes.
    IERC20 public immutable token;

    /// @notice The owner address — can fund the reward pool.
    address public immutable owner;

    /// @notice Total tokens available to pay out as rewards.
    uint256 public rewardPool;

    /**
     * @notice Stores each user's vault position.
     * @dev    `amount`      — how many tokens they have locked
     *         `unlocksAt`   — Unix timestamp when they may withdraw principal
     *         `depositedAt` — when the current accrual period started (set/reset on each deposit)
     *         `rewardDebt`  — rewards settled at top-up or withdraw, not yet claimed
     */
    struct Position {
        uint256 amount;
        uint256 unlocksAt;
        uint256 depositedAt;
        uint256 rewardDebt;
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

    /**
     * @notice Emitted when a user claims their accumulated rewards.
     * @param user   The claimer's address.
     * @param amount How many reward tokens were transferred.
     */
    event RewardClaimed(address indexed user, uint256 amount);

    /**
     * @notice Emitted when the owner adds tokens to the reward pool.
     * @param funder Address that funded the pool (must be owner).
     * @param amount How many tokens were added.
     */
    event RewardPoolFunded(address indexed funder, uint256 amount);

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

    /// @dev Thrown when the reward pool cannot cover the requested payout.
    /// @param available Current pool balance.
    /// @param required  Rewards owed to the user.
    error InsufficientRewardPool(uint256 available, uint256 required);

    /// @dev Thrown when a caller that is not the owner tries to call an owner-only function.
    error Unauthorized();

    // ── Constructor ────────────────────────────────────────────────────────────

    /**
     * @param tokenAddress Address of the SyvoraToken (LRN) ERC-20 contract.
     * @param _owner       Address that can fund the reward pool.
     */
    constructor(address tokenAddress, address _owner) {
        token = IERC20(tokenAddress);
        owner = _owner;
    }

    // ── External functions ─────────────────────────────────────────────────────

    /**
     * @notice Deposit LRN tokens into the vault.
     *
     * @dev    Before calling this function the user must have called
     *         `token.approve(address(this), amount)` so the vault is
     *         authorised to pull the tokens from their wallet.
     *
     *         If the user already has a locked position, outstanding rewards
     *         are settled first, then the new deposit is added on top and
     *         the lock timer resets from now.
     *
     * @param amount Number of LRN tokens to deposit (in smallest units, 1e18 per token).
     */
    function deposit(uint256 amount) external nonReentrant {
        // Reject zero-value deposits immediately.
        if (amount == 0) revert ZeroAmount();

        // Calculate when these tokens will unlock.
        uint256 unlocksAt = block.timestamp + LOCK_DURATION;

        Position storage pos = positions[msg.sender];

        // If user already has a position, settle their pending rewards before
        // changing the principal so the new rate applies to the new total.
        if (pos.amount > 0) {
            _settleRewards(pos);
        }

        // Update the user's position in storage BEFORE transferring tokens
        // (checks-effects-interactions pattern — prevents reentrancy issues).
        pos.amount    += amount;
        pos.unlocksAt  = unlocksAt; // reset lock on top-up
        pos.depositedAt = block.timestamp;

        // Pull the tokens from the caller into this contract.
        // transferFrom will revert if the allowance is insufficient.
        token.transferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount, unlocksAt);
    }

    /**
     * @notice Withdraw all deposited LRN tokens after the lock period expires.
     *
     * @dev    Pending rewards are settled into rewardDebt so the user can
     *         still claim them after withdrawing their principal.
     *         Uses the nonReentrant modifier to prevent reentrancy attacks.
     *         The entire position is withdrawn in one go (no partial withdrawals).
     */
    function withdraw() external nonReentrant {
        Position storage pos = positions[msg.sender];

        // Must have something deposited.
        if (pos.amount == 0) revert NothingDeposited();

        // Must wait for the lock to expire.
        if (block.timestamp < pos.unlocksAt) revert StillLocked(pos.unlocksAt);

        // Settle any pending rewards into rewardDebt before clearing principal.
        _settleRewards(pos);

        // Cache amount before clearing (checks-effects-interactions pattern).
        uint256 amount = pos.amount;

        // Clear principal fields BEFORE transferring (prevents reentrancy).
        // rewardDebt is intentionally kept so the user can still claim rewards.
        pos.amount    = 0;
        pos.unlocksAt = 0;
        pos.depositedAt = 0;

        // Send the tokens back to the user.
        token.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Claim all accumulated rewards for the caller.
     *
     * @dev    Settles any additional accrual since the last checkpoint,
     *         then transfers the full rewardDebt from the pool.
     */
    function claimRewards() external nonReentrant {
        Position storage pos = positions[msg.sender];

        // Settle any accrued-but-unsettled rewards.
        uint256 owed = _settleRewards(pos);

        if (owed == 0) return;

        if (rewardPool < owed) revert InsufficientRewardPool(rewardPool, owed);

        // Clear the debt BEFORE transferring (checks-effects-interactions).
        pos.rewardDebt = 0;
        rewardPool -= owed;

        token.transfer(msg.sender, owed);

        emit RewardClaimed(msg.sender, owed);
    }

    /**
     * @notice Add tokens to the reward pool. Only callable by the owner.
     * @param amount Number of LRN tokens to add to the pool.
     */
    function fundRewardPool(uint256 amount) external {
        if (msg.sender != owner) revert Unauthorized();
        if (amount == 0) revert ZeroAmount();

        rewardPool += amount;
        token.transferFrom(msg.sender, address(this), amount);

        emit RewardPoolFunded(msg.sender, amount);
    }

    // ── View functions ─────────────────────────────────────────────────────────

    /**
     * @notice Returns the deposited amount, unlock timestamp, accrual start,
     *         and settled reward debt for a given user.
     * @param user Address to query.
     * @return amount      Tokens currently locked.
     * @return unlocksAt   Unix timestamp when they unlock (0 if nothing deposited).
     * @return depositedAt When the current accrual period started.
     * @return rewardDebt  Rewards already settled but not yet claimed.
     */
    function getPosition(address user)
        external
        view
        returns (uint256 amount, uint256 unlocksAt, uint256 depositedAt, uint256 rewardDebt)
    {
        Position storage pos = positions[user];
        return (pos.amount, pos.unlocksAt, pos.depositedAt, pos.rewardDebt);
    }

    /**
     * @notice Returns the total rewards (settled + accruing) owed to a user.
     * @param user Address to query.
     * @return Total reward tokens currently owed.
     */
    function pendingRewards(address user) external view returns (uint256) {
        Position storage pos = positions[user];
        if (pos.amount == 0) return pos.rewardDebt;
        uint256 elapsed = block.timestamp - pos.depositedAt;
        uint256 accrued = (pos.amount * REWARD_RATE_PER_SECOND * elapsed) / 1e18;
        return pos.rewardDebt + accrued;
    }

    // ── Internal helpers ───────────────────────────────────────────────────────

    /**
     * @dev Calculates rewards accrued since the last checkpoint, adds them to
     *      rewardDebt, resets the checkpoint to now, and returns the new total.
     *      Must be called before any change to pos.amount.
     *
     * @param pos Storage reference to the user's position.
     * @return settled The updated rewardDebt after settling.
     */
    function _settleRewards(Position storage pos) internal returns (uint256 settled) {
        uint256 elapsed = block.timestamp - pos.depositedAt;
        uint256 accrued = (pos.amount * REWARD_RATE_PER_SECOND * elapsed) / 1e18;
        settled = pos.rewardDebt + accrued;
        pos.rewardDebt = settled;
        pos.depositedAt = block.timestamp;
    }
}

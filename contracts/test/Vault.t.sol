// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../src/SyvoraToken.sol";
import "../src/Vault.sol";

/**
 * @title  VaultTest
 * @notice Unit tests for the Vault contract.
 *
 * Key cheatcodes used:
 *  - vm.prank(addr)         — next call comes from `addr`
 *  - vm.warp(timestamp)     — set block.timestamp to a specific value
 *  - vm.expectRevert(...)   — assert the next call reverts with a specific error
 *  - vm.expectEmit(...)     — assert the next call emits a specific event
 */
contract VaultTest is Test {
    // ── Contracts under test ───────────────────────────────────────────────────

    SyvoraToken public token;
    Vault       public vault;

    // ── Test actors ────────────────────────────────────────────────────────────

    address public owner = makeAddr("owner");
    address public alice = makeAddr("alice");
    address public bob   = makeAddr("bob");

    // ── Constants ──────────────────────────────────────────────────────────────

    uint256 constant LOCK_DURATION  = 7 days;
    uint256 constant DEPOSIT_AMOUNT = 1_000 * 1e18; // 1,000 LRN

    // ── Setup ──────────────────────────────────────────────────────────────────

    /**
     * @dev Runs before every test:
     *      1. Deploy SyvoraToken (owner receives 1,000,000 LRN)
     *      2. Deploy Vault pointing at the token
     *      3. Give alice some LRN to deposit
     */
    function setUp() public {
        vm.startPrank(owner);
        token = new SyvoraToken(owner);
        vault = new Vault(address(token));

        // Transfer 10,000 LRN to alice so she has tokens to test with
        token.transfer(alice, 10_000 * 1e18);
        vm.stopPrank();
    }

    // ── Helper ─────────────────────────────────────────────────────────────────

    /**
     * @dev Convenience: alice approves the vault then deposits DEPOSIT_AMOUNT.
     */
    function _aliceDeposit(uint256 amount) internal {
        vm.startPrank(alice);
        token.approve(address(vault), amount);
        vault.deposit(amount);
        vm.stopPrank();
    }

    // ── Constructor / setup tests ──────────────────────────────────────────────

    /// @notice Vault should point to the correct token contract
    function test_TokenAddressIsSet() public view {
        assertEq(address(vault.token()), address(token));
    }

    /// @notice Lock duration constant should be 7 days
    function test_LockDurationIs7Days() public view {
        assertEq(vault.LOCK_DURATION(), 7 days);
    }

    // ── Deposit tests ──────────────────────────────────────────────────────────

    /// @notice A successful deposit stores the correct position
    function test_DepositStoresPosition() public {
        uint256 depositTime = block.timestamp;
        _aliceDeposit(DEPOSIT_AMOUNT);

        (uint256 amount, uint256 unlocksAt) = vault.getPosition(alice);

        assertEq(amount,    DEPOSIT_AMOUNT);
        assertEq(unlocksAt, depositTime + LOCK_DURATION);
    }

    /// @notice Depositing transfers tokens from alice to the vault
    function test_DepositTransfersTokens() public {
        uint256 aliceBefore = token.balanceOf(alice);
        _aliceDeposit(DEPOSIT_AMOUNT);

        assertEq(token.balanceOf(alice),         aliceBefore - DEPOSIT_AMOUNT);
        assertEq(token.balanceOf(address(vault)), DEPOSIT_AMOUNT);
    }

    /// @notice Deposit should emit the Deposited event with correct args
    function test_DepositEmitsEvent() public {
        uint256 expectedUnlocksAt = block.timestamp + LOCK_DURATION;

        // Approve first so it doesn't produce a log between expectEmit and deposit.
        vm.prank(alice);
        token.approve(address(vault), DEPOSIT_AMOUNT);

        // vm.expectEmit intercepts the very next emitted log.
        // We set it immediately before vault.deposit so the Deposited event
        // is the first log produced after this cheatcode.
        vm.expectEmit(true, true, true, true, address(vault));
        emit Vault.Deposited(alice, DEPOSIT_AMOUNT, expectedUnlocksAt);

        vm.prank(alice);
        vault.deposit(DEPOSIT_AMOUNT);
    }

    /// @notice Depositing zero tokens should revert with ZeroAmount
    function test_DepositZeroReverts() public {
        // vm.expectRevert intercepts the very next external call.
        // We call vault.deposit(0) directly — no approve needed because
        // the ZeroAmount check happens before any token transfer.
        vm.expectRevert(Vault.ZeroAmount.selector);

        vm.prank(alice);
        vault.deposit(0);
    }

    /// @notice Depositing without prior approval should revert
    function test_DepositWithoutApprovalReverts() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC20Errors.ERC20InsufficientAllowance.selector,
                address(vault), // spender
                0,              // current allowance
                DEPOSIT_AMOUNT  // required
            )
        );

        vm.prank(alice);
        vault.deposit(DEPOSIT_AMOUNT); // no approve() beforehand
    }

    /// @notice A second deposit tops up the amount and resets the lock timer
    function test_SecondDepositTopsUpAndResetsLock() public {
        _aliceDeposit(DEPOSIT_AMOUNT);

        // Fast-forward 3 days (still within lock period)
        vm.warp(block.timestamp + 3 days);

        uint256 secondDeposit = 500 * 1e18;
        _aliceDeposit(secondDeposit);

        (uint256 amount, uint256 unlocksAt) = vault.getPosition(alice);

        // Total should be combined
        assertEq(amount, DEPOSIT_AMOUNT + secondDeposit);
        // Lock should have reset from the second deposit time
        assertEq(unlocksAt, block.timestamp + LOCK_DURATION);
    }

    // ── Withdraw tests ─────────────────────────────────────────────────────────

    /// @notice Withdrawing before lock expires should revert with StillLocked
    function test_WithdrawBeforeLockReverts() public {
        _aliceDeposit(DEPOSIT_AMOUNT);

        uint256 unlocksAt = block.timestamp + LOCK_DURATION;

        // Advance time but NOT enough — one second before unlock
        vm.warp(unlocksAt - 1);

        vm.expectRevert(
            abi.encodeWithSelector(Vault.StillLocked.selector, unlocksAt)
        );

        vm.prank(alice);
        vault.withdraw();
    }

    /// @notice Withdrawing exactly at the unlock timestamp should succeed
    function test_WithdrawAtUnlockTimestamp() public {
        _aliceDeposit(DEPOSIT_AMOUNT);

        uint256 unlocksAt = block.timestamp + LOCK_DURATION;

        // Warp to the exact unlock moment
        vm.warp(unlocksAt);

        uint256 aliceBefore = token.balanceOf(alice);

        vm.prank(alice);
        vault.withdraw();

        // Alice should have her tokens back
        assertEq(token.balanceOf(alice), aliceBefore + DEPOSIT_AMOUNT);
    }

    /// @notice After a successful withdrawal the position should be cleared
    function test_WithdrawClearsPosition() public {
        _aliceDeposit(DEPOSIT_AMOUNT);
        vm.warp(block.timestamp + LOCK_DURATION);

        vm.prank(alice);
        vault.withdraw();

        (uint256 amount, uint256 unlocksAt) = vault.getPosition(alice);
        assertEq(amount,    0);
        assertEq(unlocksAt, 0);
    }

    /// @notice Withdraw should emit the Withdrawn event
    function test_WithdrawEmitsEvent() public {
        _aliceDeposit(DEPOSIT_AMOUNT);
        vm.warp(block.timestamp + LOCK_DURATION);

        vm.expectEmit(true, true, true, true, address(vault));
        emit Vault.Withdrawn(alice, DEPOSIT_AMOUNT);

        vm.prank(alice);
        vault.withdraw();
    }

    /// @notice Withdrawing with no deposit should revert with NothingDeposited
    function test_WithdrawNothingReverts() public {
        vm.expectRevert(Vault.NothingDeposited.selector);

        vm.prank(alice);
        vault.withdraw();
    }

    /// @notice Two users' positions are independent of each other
    function test_MultipleUsersIndependentPositions() public {
        // Give bob some tokens
        vm.prank(owner);
        token.transfer(bob, 5_000 * 1e18);

        uint256 aliceAmount = 1_000 * 1e18;
        uint256 bobAmount   = 2_000 * 1e18;

        // Alice deposits
        vm.startPrank(alice);
        token.approve(address(vault), aliceAmount);
        vault.deposit(aliceAmount);
        vm.stopPrank();

        // Bob deposits
        vm.startPrank(bob);
        token.approve(address(vault), bobAmount);
        vault.deposit(bobAmount);
        vm.stopPrank();

        (uint256 alicePos,) = vault.getPosition(alice);
        (uint256 bobPos,)   = vault.getPosition(bob);

        assertEq(alicePos, aliceAmount);
        assertEq(bobPos,   bobAmount);

        // Fast-forward past lock
        vm.warp(block.timestamp + LOCK_DURATION);

        // Bob withdraws — alice's position is unaffected
        vm.prank(bob);
        vault.withdraw();

        (uint256 aliceAfter,) = vault.getPosition(alice);
        assertEq(aliceAfter, aliceAmount); // unchanged
    }

    /// @notice Vault token balance matches the sum of all deposits
    function test_VaultBalanceMatchesDeposits() public {
        _aliceDeposit(DEPOSIT_AMOUNT);

        assertEq(token.balanceOf(address(vault)), DEPOSIT_AMOUNT);

        // Alice withdraws after lock
        vm.warp(block.timestamp + LOCK_DURATION);
        vm.prank(alice);
        vault.withdraw();

        assertEq(token.balanceOf(address(vault)), 0);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// forge-std gives us the Test base contract with assertion helpers,
// and the Vm cheatcode interface for manipulating the EVM in tests.
import "forge-std/Test.sol";
import "../src/SyvoraToken.sol";

/**
 * @title  SyvoraTokenTest
 * @notice Unit tests for the SyvoraToken ERC-20 contract.
 *
 * How Foundry tests work:
 *  - Every function that starts with `test` is run as a test case.
 *  - `setUp()` runs before each test to give each test a clean slate.
 *  - `vm.*` cheatcodes let us manipulate blockchain state (time, caller, etc.).
 *  - `assertEq`, `assertTrue`, etc. are assertion helpers from forge-std.
 */
contract SyvoraTokenTest is Test {
    // ── Contracts under test ───────────────────────────────────────────────────

    SyvoraToken public token;

    // ── Test actors ────────────────────────────────────────────────────────────

    address public owner   = makeAddr("owner");   // makeAddr creates a labelled address
    address public alice   = makeAddr("alice");
    address public bob     = makeAddr("bob");

    // ── Constants ──────────────────────────────────────────────────────────────

    uint256 constant INITIAL_SUPPLY = 1_000_000 * 1e18;

    // ── Setup ──────────────────────────────────────────────────────────────────

    /**
     * @dev Runs before every test function.
     *      We deploy a fresh SyvoraToken owned by `owner`.
     */
    function setUp() public {
        // vm.prank makes the next call come from `owner` instead of address(this)
        vm.prank(owner);
        token = new SyvoraToken(owner);
    }

    // ── Deployment tests ───────────────────────────────────────────────────────

    /// @notice Token name should be "SyvoraToken"
    function test_Name() public view {
        assertEq(token.name(), "SyvoraToken");
    }

    /// @notice Token symbol should be "LRN"
    function test_Symbol() public view {
        assertEq(token.symbol(), "LRN");
    }

    /// @notice Decimals should be the ERC-20 standard of 18
    function test_Decimals() public view {
        assertEq(token.decimals(), 18);
    }

    /// @notice The deployer (owner) should receive the full initial supply
    function test_InitialSupplyMintedToOwner() public view {
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
        assertEq(token.totalSupply(),    INITIAL_SUPPLY);
    }

    /// @notice The owner address should be set correctly
    function test_OwnerIsSet() public view {
        assertEq(token.owner(), owner);
    }

    // ── Minting tests ──────────────────────────────────────────────────────────

    /// @notice Owner can mint tokens to any address
    function test_OwnerCanMint() public {
        uint256 mintAmount = 500 * 1e18;

        vm.prank(owner);
        token.mint(alice, mintAmount);

        assertEq(token.balanceOf(alice), mintAmount);
        assertEq(token.totalSupply(), INITIAL_SUPPLY + mintAmount);
    }

    /// @notice Non-owner cannot mint — should revert
    function test_NonOwnerCannotMint() public {
        // vm.expectRevert tells Foundry: the NEXT call must revert.
        // We pass the exact error selector that OwnableUnauthorizedAccount emits.
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                alice
            )
        );

        vm.prank(alice);
        token.mint(alice, 100 * 1e18);
    }

    // ── Transfer tests ─────────────────────────────────────────────────────────

    /// @notice Standard ERC-20 transfer should work correctly
    function test_Transfer() public {
        uint256 amount = 100 * 1e18;

        vm.prank(owner);
        token.transfer(alice, amount);

        assertEq(token.balanceOf(alice), amount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - amount);
    }

    /// @notice Approve + transferFrom flow (used by the Vault)
    function test_ApproveAndTransferFrom() public {
        uint256 amount = 200 * 1e18;

        // owner gives alice an allowance
        vm.prank(owner);
        token.approve(alice, amount);

        assertEq(token.allowance(owner, alice), amount);

        // alice uses the allowance to pull tokens to bob
        vm.prank(alice);
        token.transferFrom(owner, bob, amount);

        assertEq(token.balanceOf(bob), amount);
        assertEq(token.allowance(owner, alice), 0); // allowance fully consumed
    }

    /// @notice Transferring more than the balance should revert
    function test_TransferInsufficientBalance() public {
        // alice has 0 tokens — any transfer should fail
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC20Errors.ERC20InsufficientBalance.selector,
                alice,   // sender
                0,       // current balance
                1e18     // attempted amount
            )
        );

        vm.prank(alice);
        token.transfer(bob, 1e18);
    }
}

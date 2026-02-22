/**
 * Contract ABIs in human-readable format.
 *
 * Human-readable ABI is a shorthand that ethers.js understands — instead of
 * the raw JSON output from the compiler, we write function signatures as
 * strings. This is much easier to read and is the idiomatic ethers v6 style.
 *
 * We only include the functions and events that the frontend actually calls.
 * The full ABI is in contracts/out/ if you ever need it.
 */

// ── SyvoraToken (ERC-20) ────────────────────────────────────────────────────
export const SYVORATOKEN_ABI = [
  // Read
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',

  // Write
  'function approve(address spender, uint256 value) returns (bool)',
  'function transfer(address to, uint256 value) returns (bool)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const

// ── Vault ───────────────────────────────────────────────────────────────────
export const VAULT_ABI = [
  // Read
  'function getPosition(address user) view returns (uint256 amount, uint256 unlocksAt, uint256 depositedAt, uint256 rewardDebt)',
  'function pendingRewards(address user) view returns (uint256)',
  'function rewardPool() view returns (uint256)',
  'function LOCK_DURATION() view returns (uint256)',

  // Write
  'function deposit(uint256 amount)',
  'function withdraw()',
  'function claimRewards()',
  'function fundRewardPool(uint256 amount)',

  // Events
  'event Deposited(address indexed user, uint256 amount, uint256 unlocksAt)',
  'event Withdrawn(address indexed user, uint256 amount)',
  'event RewardClaimed(address indexed user, uint256 amount)',
  'event RewardPoolFunded(address indexed funder, uint256 amount)',
] as const

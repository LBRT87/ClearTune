import { parseAbi } from "viem";

// Addresses are populated after `forge script script/Deploy.s.sol` — see
// contracts/README and the root README's testing section.
export const CLEARTUNE_ADDRESS = (process.env.NEXT_PUBLIC_CLEARTUNE_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const MOCKUSD_ADDRESS = (process.env.NEXT_PUBLIC_MOCKUSD_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const clearTuneAbi = parseAbi([
  "function registerSong(bytes32 fingerprint, bytes32 contentHash, string uri, address[] payees, uint16[] bps) returns (uint256 songId)",
  "function getSongPayees(uint256 songId) view returns (address[], uint16[])",
  "function songs(uint256) view returns (bytes32 fingerprint, bytes32 contentHash, string uri, address registrar, bool exists)",
  "function reportPlays((address listener, uint256 songId)[] reports)",
  "function subscribe(uint256 amount)",
  "function toggleAutoRefill(bool enabled)",
  "function withdraw()",
  "function fundTreasury(uint256 amount)",
  "function setConfig(uint256 newPlayCap, uint256 newRatePerPlay, uint16 newPlatformFeeBps)",
  "function getConfig() view returns (uint256 playCap, uint256 ratePerPlay, uint16 platformFeeBps)",
  "function advancePeriod()",
  "function playsThisMonth(address) view returns (uint256)",
  "function autoRefillEnabled(address) view returns (bool)",
  "function subBalance(address) view returns (uint256)",
  "function earned(address) view returns (uint256)",
  "function treasury() view returns (uint256)",
  "function owner() view returns (address)",
  "function backend() view returns (address)",
  "event SongRegistered(uint256 indexed songId, bytes32 fingerprint, address indexed registrar)",
  "event Subscribed(address indexed listener, uint256 amount, uint256 newBalance)",
  "event AutoRefillSet(address indexed listener, bool enabled)",
  "event PlayReported(address indexed listener, uint256 indexed songId, uint8 fundedBy, uint256 amount, uint256 period)",
  "event Withdrawn(address indexed payee, uint256 amount)",
]);

export const mockUsdAbi = parseAbi([
  "function faucet()",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

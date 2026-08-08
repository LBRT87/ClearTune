// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMockUSD {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title ClearTune
/// @notice Royalty router: per-play, real-time, on-chain settlement to song payees.
/// Money and chart-trust are separate paths — this contract only ever moves money;
/// trust scoring happens off-chain and never blocks a payment. See project-spec.md.
contract ClearTune {
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    struct Song {
        bytes32 fingerprint; // audio fingerprint, duplicate check
        bytes32 contentHash; // file hash, authenticity check
        string uri; // Supabase Storage location
        address[] payees;
        uint16[] bps; // basis points, must sum to 10000
        address registrar;
        bool exists;
    }

    struct PlayReport {
        address listener;
        uint256 songId;
    }

    enum FundedBy {
        Subscription,
        Treasury
    }

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    IMockUSD public immutable token;
    address public owner;
    address public backend; // authorized off-chain reporter for reportPlays

    uint256 public nextSongId = 1;
    mapping(uint256 => Song) public songs;
    mapping(bytes32 => bool) public fingerprintUsed;

    mapping(address => uint256) public playsThisMonth;
    mapping(address => uint256) public listenerPeriod;
    uint256 public currentPeriod = 1;

    mapping(address => bool) public autoRefillEnabled;
    mapping(address => uint256) public subBalance;

    mapping(address => uint256) public earned; // pull-pattern payee balances
    uint256 public treasury;

    uint256 public playCap = 1000;
    uint256 public ratePerPlay = 1000; // smallest units of mUSD (6 decimals)
    uint16 public platformFeeBps = 800; // 8%

    uint256 public constant MAX_PAYEES = 10;
    uint16 public constant TOTAL_BPS = 10000;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event SongRegistered(uint256 indexed songId, bytes32 fingerprint, address indexed registrar);
    event Subscribed(address indexed listener, uint256 amount, uint256 newBalance);
    event AutoRefillSet(address indexed listener, bool enabled);
    event PlayReported(
        address indexed listener, uint256 indexed songId, FundedBy fundedBy, uint256 amount, uint256 period
    );
    event Withdrawn(address indexed payee, uint256 amount);
    event TreasuryFunded(address indexed from, uint256 amount);
    event ConfigUpdated(uint256 playCap, uint256 ratePerPlay, uint16 platformFeeBps);
    event BackendUpdated(address indexed backend);
    event PeriodAdvanced(uint256 newPeriod);

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------

    modifier onlyOwner() {
        require(msg.sender == owner, "ClearTune: not owner");
        _;
    }

    modifier onlyBackend() {
        require(msg.sender == backend || msg.sender == owner, "ClearTune: not backend");
        _;
    }

    constructor(address tokenAddress, address backendAddress) {
        require(tokenAddress != address(0), "ClearTune: zero token");
        token = IMockUSD(tokenAddress);
        owner = msg.sender;
        backend = backendAddress;
    }

    // ---------------------------------------------------------------------
    // Song registry
    // ---------------------------------------------------------------------

    function registerSong(
        bytes32 fingerprint,
        bytes32 contentHash,
        string calldata uri,
        address[] calldata payees,
        uint16[] calldata bps
    ) external returns (uint256 songId) {
        require(!fingerprintUsed[fingerprint], "ClearTune: fingerprint already registered");
        require(payees.length > 0 && payees.length <= MAX_PAYEES, "ClearTune: bad payee count");
        require(payees.length == bps.length, "ClearTune: payees/bps length mismatch");

        uint256 sum;
        for (uint256 i = 0; i < payees.length; i++) {
            require(payees[i] != address(0), "ClearTune: zero address payee");
            for (uint256 j = i + 1; j < payees.length; j++) {
                require(payees[i] != payees[j], "ClearTune: duplicate payee");
            }
            sum += bps[i];
        }
        require(sum == TOTAL_BPS, "ClearTune: bps must sum to 10000");

        songId = nextSongId++;
        Song storage s = songs[songId];
        s.fingerprint = fingerprint;
        s.contentHash = contentHash;
        s.uri = uri;
        s.payees = payees;
        s.bps = bps;
        s.registrar = msg.sender;
        s.exists = true;

        fingerprintUsed[fingerprint] = true;
        emit SongRegistered(songId, fingerprint, msg.sender);
    }

    function getSongPayees(uint256 songId) external view returns (address[] memory, uint16[] memory) {
        Song storage s = songs[songId];
        require(s.exists, "ClearTune: unknown song");
        return (s.payees, s.bps);
    }

    // ---------------------------------------------------------------------
    // Listener subscription
    // ---------------------------------------------------------------------

    function subscribe(uint256 amount) external {
        require(amount > 0, "ClearTune: zero amount");
        require(token.transferFrom(msg.sender, address(this), amount), "ClearTune: transferFrom failed");
        subBalance[msg.sender] += amount;
        emit Subscribed(msg.sender, amount, subBalance[msg.sender]);
    }

    /// @notice Explicit opt-in/opt-out. Never enabled by default — see project-spec.md 2.2.
    function toggleAutoRefill(bool enabled) external {
        autoRefillEnabled[msg.sender] = enabled;
        emit AutoRefillSet(msg.sender, enabled);
    }

    // ---------------------------------------------------------------------
    // Play reporting / settlement
    // ---------------------------------------------------------------------

    function reportPlays(PlayReport[] calldata reports) external onlyBackend {
        for (uint256 i = 0; i < reports.length; i++) {
            _settlePlay(reports[i].listener, reports[i].songId);
        }
    }

    function _settlePlay(address listener, uint256 songId) internal {
        Song storage s = songs[songId];
        require(s.exists, "ClearTune: unknown song");

        _rollPeriod(listener);

        uint256 fee = (ratePerPlay * platformFeeBps) / TOTAL_BPS;
        uint256 toPayees = ratePerPlay - fee;

        bool underCap = playsThisMonth[listener] < playCap;
        bool refillCovers = autoRefillEnabled[listener] && subBalance[listener] >= ratePerPlay;

        if (underCap || refillCovers) {
            require(subBalance[listener] >= ratePerPlay, "ClearTune: insufficient subscription balance");
            subBalance[listener] -= ratePerPlay;
            treasury += fee;
            _distribute(s, toPayees);
            playsThisMonth[listener] += 1;
            emit PlayReported(listener, songId, FundedBy.Subscription, ratePerPlay, currentPeriod);
        } else {
            // Cap reached, auto-refill not covering it: play is still valid (for trust
            // layer purposes) and the artist is still paid — funded by treasury, no
            // deduction from the listener. See project-spec.md 2.2 "musisi selalu dibayar".
            require(treasury >= toPayees, "ClearTune: treasury insufficient");
            treasury -= toPayees;
            _distribute(s, toPayees);
            playsThisMonth[listener] += 1;
            emit PlayReported(listener, songId, FundedBy.Treasury, toPayees, currentPeriod);
        }
    }

    function _distribute(Song storage s, uint256 amount) internal {
        uint256 n = s.payees.length;
        uint256 distributed;
        for (uint256 i = 0; i < n - 1; i++) {
            uint256 share = (amount * s.bps[i]) / TOTAL_BPS;
            earned[s.payees[i]] += share;
            distributed += share;
        }
        // Dust goes to the last payee — see project-spec.md section 6.
        earned[s.payees[n - 1]] += amount - distributed;
    }

    function _rollPeriod(address listener) internal {
        if (listenerPeriod[listener] != currentPeriod) {
            listenerPeriod[listener] = currentPeriod;
            playsThisMonth[listener] = 0;
        }
    }

    // ---------------------------------------------------------------------
    // Withdrawals (pull pattern, checks-effects-interactions)
    // ---------------------------------------------------------------------

    function withdraw() external {
        uint256 amount = earned[msg.sender];
        require(amount > 0, "ClearTune: nothing to withdraw");
        earned[msg.sender] = 0;
        require(token.transfer(msg.sender, amount), "ClearTune: transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    // ---------------------------------------------------------------------
    // Treasury
    // ---------------------------------------------------------------------

    /// @notice Anyone can top up the treasury (demo seeding, or a platform-side subsidy).
    function fundTreasury(uint256 amount) external {
        require(amount > 0, "ClearTune: zero amount");
        require(token.transferFrom(msg.sender, address(this), amount), "ClearTune: transferFrom failed");
        treasury += amount;
        emit TreasuryFunded(msg.sender, amount);
    }

    // ---------------------------------------------------------------------
    // Owner config — all business numbers are parameters, never hardcoded
    // in the frontend. See project-spec.md 2.2 and section 9.
    // ---------------------------------------------------------------------

    function setConfig(uint256 newPlayCap, uint256 newRatePerPlay, uint16 newPlatformFeeBps) external onlyOwner {
        require(newPlatformFeeBps <= TOTAL_BPS, "ClearTune: fee bps out of range");
        playCap = newPlayCap;
        ratePerPlay = newRatePerPlay;
        platformFeeBps = newPlatformFeeBps;
        emit ConfigUpdated(newPlayCap, newRatePerPlay, newPlatformFeeBps);
    }

    function getConfig() external view returns (uint256, uint256, uint16) {
        return (playCap, ratePerPlay, platformFeeBps);
    }

    function setBackend(address newBackend) external onlyOwner {
        backend = newBackend;
        emit BackendUpdated(newBackend);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ClearTune: zero owner");
        owner = newOwner;
    }

    /// @notice Demo/dev control: simulate a month rollover without waiting a month.
    /// Lazily resets playsThisMonth for every listener on their next reported play.
    function advancePeriod() external onlyOwner {
        currentPeriod += 1;
        emit PeriodAdvanced(currentPeriod);
    }
}

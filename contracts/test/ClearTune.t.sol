// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockUSD} from "../src/MockUSD.sol";
import {ClearTune} from "../src/ClearTune.sol";

contract ClearTuneTest is Test {
    MockUSD token;
    ClearTune router;

    address owner = address(this);
    address backend = address(0xB0B);
    address listener = address(0xA11CE);
    address artist1 = address(0xAA1);
    address artist2 = address(0xAA2);

    function setUp() public {
        token = new MockUSD();
        router = new ClearTune(address(token), backend);

        vm.prank(listener);
        token.faucet();
        vm.prank(listener);
        token.approve(address(router), type(uint256).max);
    }

    function _registerSong() internal returns (uint256 songId) {
        address[] memory payees = new address[](2);
        payees[0] = artist1;
        payees[1] = artist2;
        uint16[] memory bps = new uint16[](2);
        bps[0] = 6000;
        bps[1] = 4000;
        songId = router.registerSong(keccak256("fp1"), keccak256("hash1"), "ipfs://song1", payees, bps);
    }

    function _topUp(uint256 amount) internal {
        vm.prank(listener);
        router.topUp(amount);
    }

    function _report(uint256 songId) internal {
        ClearTune.PlayReport[] memory reports = new ClearTune.PlayReport[](1);
        reports[0] = ClearTune.PlayReport({listener: listener, songId: songId});
        vm.prank(backend);
        router.reportPlays(reports);
    }

    function test_registerSong_rejectsBadBpsSum() public {
        address[] memory payees = new address[](1);
        payees[0] = artist1;
        uint16[] memory bps = new uint16[](1);
        bps[0] = 9000;
        vm.expectRevert(bytes("ClearTune: bps must sum to 10000"));
        router.registerSong(keccak256("fpX"), keccak256("hX"), "uri", payees, bps);
    }

    function test_registerSong_rejectsDuplicateFingerprint() public {
        _registerSong();
        address[] memory payees = new address[](1);
        payees[0] = artist1;
        uint16[] memory bps = new uint16[](1);
        bps[0] = 10000;
        vm.expectRevert(bytes("ClearTune: fingerprint already registered"));
        router.registerSong(keccak256("fp1"), keccak256("hash2"), "uri2", payees, bps);
    }

    function test_registerSong_rejectsZeroAddressPayee() public {
        address[] memory payees = new address[](1);
        payees[0] = address(0);
        uint16[] memory bps = new uint16[](1);
        bps[0] = 10000;
        vm.expectRevert(bytes("ClearTune: zero address payee"));
        router.registerSong(keccak256("fpZ"), keccak256("hZ"), "uri", payees, bps);
    }

    function test_registerSong_rejectsDuplicatePayee() public {
        address[] memory payees = new address[](2);
        payees[0] = artist1;
        payees[1] = artist1;
        uint16[] memory bps = new uint16[](2);
        bps[0] = 5000;
        bps[1] = 5000;
        vm.expectRevert(bytes("ClearTune: duplicate payee"));
        router.registerSong(keccak256("fpD"), keccak256("hD"), "uri", payees, bps);
    }

    function test_registerSong_rejectsTooManyPayees() public {
        address[] memory payees = new address[](11);
        uint16[] memory bps = new uint16[](11);
        uint256 share = uint256(10000) / 11;
        for (uint256 i = 0; i < 11; i++) {
            payees[i] = address(uint160(0x1000 + i));
            bps[i] = uint16(share);
        }
        vm.expectRevert(bytes("ClearTune: bad payee count"));
        router.registerSong(keccak256("fp11"), keccak256("h11"), "uri", payees, bps);
    }

    function test_topUp_rejectsBelowMinimum() public {
        (,, uint256 minTopUp) = router.getConfig();
        vm.prank(listener);
        vm.expectRevert(bytes("ClearTune: below minimum top-up"));
        router.topUp(minTopUp - 1);
    }

    function test_topUp_increasesBalance() public {
        (,, uint256 minTopUp) = router.getConfig();
        _topUp(minTopUp);
        assertEq(router.balance(listener), minTopUp);
    }

    function test_playWithSufficientBalance_deductsAndPays() public {
        uint256 songId = _registerSong();
        _topUp(50 * 10 ** 6);

        _report(songId);

        (uint256 ratePerPlay,,) = router.getConfig();
        assertEq(router.balance(listener), 50 * 10 ** 6 - ratePerPlay);
        assertGt(router.earned(artist1), 0);
        assertGt(router.earned(artist2), 0);
        assertGt(router.treasury(), 0);
    }

    function test_playWithInsufficientBalance_skipsWithoutRevert() public {
        uint256 songId = _registerSong();

        assertEq(router.balance(listener), 0);
        _report(songId);

        assertEq(router.earned(artist1), 0);
        assertEq(router.earned(artist2), 0);
        assertEq(router.treasury(), 0);
    }

    function test_reportPlays_batchSkipsLowBalanceButProcessesRest() public {
        uint256 songId = _registerSong();
        (uint256 ratePerPlay, uint16 feeBps,) = router.getConfig();
        router.setConfig(ratePerPlay, feeBps, ratePerPlay);
        _topUp(ratePerPlay);

        ClearTune.PlayReport[] memory reports = new ClearTune.PlayReport[](2);
        reports[0] = ClearTune.PlayReport({listener: listener, songId: songId});
        reports[1] = ClearTune.PlayReport({listener: listener, songId: songId});
        vm.prank(backend);
        router.reportPlays(reports);

        assertEq(router.balance(listener), 0);
        assertGt(router.earned(artist1) + router.earned(artist2), 0);
    }

    function test_withdraw_zeroesBalanceBeforeTransfer() public {
        uint256 songId = _registerSong();
        _topUp(50 * 10 ** 6);
        _report(songId);

        uint256 owed = router.earned(artist1);
        assertGt(owed, 0);

        vm.prank(artist1);
        router.withdraw();

        assertEq(router.earned(artist1), 0);
        assertEq(token.balanceOf(artist1), owed);
    }

    function test_withdrawTreasury_movesFeeToOwner() public {
        uint256 songId = _registerSong();
        _topUp(50 * 10 ** 6);
        _report(songId);

        uint256 fee = router.treasury();
        assertGt(fee, 0);

        address treasuryRecipient = address(0xCA5);
        router.withdrawTreasury(treasuryRecipient, fee);

        assertEq(router.treasury(), 0);
        assertEq(token.balanceOf(treasuryRecipient), fee);
    }

    function test_withdrawTreasury_rejectsAboveBalance() public {
        vm.expectRevert(bytes("ClearTune: invalid treasury amount"));
        router.withdrawTreasury(address(0xCA5), 1);
    }

    function test_withdrawTreasury_onlyOwner() public {
        vm.prank(listener);
        vm.expectRevert(bytes("ClearTune: not owner"));
        router.withdrawTreasury(listener, 0);
    }

    function test_onlyOwner_canChangeConfig() public {
        vm.prank(listener);
        vm.expectRevert(bytes("ClearTune: not owner"));
        router.setConfig(1, 1, 1);
    }

    function test_onlyBackend_canReportPlays() public {
        uint256 songId = _registerSong();
        ClearTune.PlayReport[] memory reports = new ClearTune.PlayReport[](1);
        reports[0] = ClearTune.PlayReport({listener: listener, songId: songId});

        vm.prank(listener);
        vm.expectRevert(bytes("ClearTune: not backend"));
        router.reportPlays(reports);
    }

    function test_dustGoesToLastPayee() public {
        address[] memory payees = new address[](3);
        payees[0] = artist1;
        payees[1] = artist2;
        payees[2] = address(0xAA3);
        uint16[] memory bps = new uint16[](3);
        bps[0] = 3333;
        bps[1] = 3333;
        bps[2] = 3334;
        uint256 songId = router.registerSong(keccak256("fp3"), keccak256("h3"), "uri3", payees, bps);

        _topUp(50 * 10 ** 6);
        _report(songId);

        uint256 total = router.earned(artist1) + router.earned(artist2) + router.earned(address(0xAA3));
        (uint256 ratePerPlay, uint16 feeBps,) = router.getConfig();
        uint256 expectedToPayees = ratePerPlay - (ratePerPlay * feeBps) / 10000;
        assertEq(total, expectedToPayees, "no dust should be lost");
    }
}

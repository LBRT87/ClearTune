// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MockUSD} from "../src/MockUSD.sol";
import {ClearTune} from "../src/ClearTune.sol";

/// Usage:
///   forge script script/Deploy.s.sol:Deploy --rpc-url $MONAD_RPC_URL --broadcast --private-key $PRIVATE_KEY
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address backend = vm.envOr("BACKEND_ADDRESS", vm.addr(deployerKey));

        vm.startBroadcast(deployerKey);

        MockUSD token = new MockUSD();
        ClearTune router = new ClearTune(address(token), backend);

        // Seed the treasury a bit so free (over-cap) plays have something to draw
        // from immediately after deploy.
        token.faucet();
        token.approve(address(router), 1_000 * 10 ** 6);
        router.fundTreasury(1_000 * 10 ** 6);

        vm.stopBroadcast();

        console.log("MockUSD deployed at:", address(token));
        console.log("ClearTune deployed at:", address(router));
        console.log("Backend authorized:", backend);
    }
}

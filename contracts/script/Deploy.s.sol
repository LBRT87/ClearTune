// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MockUSD} from "../src/MockUSD.sol";
import {ClearTune} from "../src/ClearTune.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address backend = vm.envOr("BACKEND_ADDRESS", vm.addr(deployerKey));

        vm.startBroadcast(deployerKey);

        MockUSD token = new MockUSD();
        ClearTune router = new ClearTune(address(token), backend);

        vm.stopBroadcast();

        console.log("MockUSD deployed at:", address(token));
        console.log("ClearTune deployed at:", address(router));
        console.log("Backend authorized:", backend);
    }
}

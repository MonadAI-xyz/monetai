// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {MonetAI} from "../src/MonetAI.sol";
import {MonetAIGovernor} from "../src/MonetAIGovernor.sol";

contract MonetAIDeploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address admin = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy token with deployer as all roles initially
        // Parameters: defaultAdmin, pauser, recipient, minter, burner
        MonetAI token = new MonetAI(admin, admin, admin, admin, admin);
        
        // Deploy governor with token
        MonetAIGovernor governor = new MonetAIGovernor(token);

        // Transfer roles to governor
        token.grantRole(token.MINTER_ROLE(), address(governor));
        token.grantRole(token.BURNER_ROLE(), address(governor));
        token.grantRole(token.PAUSER_ROLE(), address(governor));

        // Log deployed addresses
        console2.log("Token deployed to:", address(token));
        console2.log("Governor deployed to:", address(governor));

        vm.stopBroadcast();
    }
} 
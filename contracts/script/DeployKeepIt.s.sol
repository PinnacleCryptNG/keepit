// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {KeepIt} from "../KeepIt.sol";

/// @notice Deploys KeepIt on an Arc network (mainnet 5042 or testnet 5042002) with the native USDC predeploy.
/// @dev KeepIt has no owner, admin or upgrade path, so whoever signs this transaction gets no special rights.
/// Run it WITHOUT `--broadcast` first for a dry run. Sign with an encrypted keystore (`--account`), never a raw key flag.
contract DeployKeepIt is Script {
    /// @dev USDC is a fixed predeploy at the same address on every Arc network.
    address internal constant ARC_USDC = 0x3600000000000000000000000000000000000000;

    function run() external returns (KeepIt keepIt) {
        require(block.chainid == 5042 || block.chainid == 5042002, "DeployKeepIt: not an Arc network");
        require(ARC_USDC.code.length > 0, "DeployKeepIt: USDC predeploy not found");

        console2.log("Deploying KeepIt on chain", block.chainid);
        vm.startBroadcast();
        keepIt = new KeepIt(IERC20(ARC_USDC));
        vm.stopBroadcast();

        require(address(keepIt.usdc()) == ARC_USDC, "DeployKeepIt: wrong USDC");
        console2.log("KeepIt deployed at", address(keepIt));
    }
}

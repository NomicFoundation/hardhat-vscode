// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IfVault as Vault, ifDouble as twice} from "./IfBase.sol";

contract IfUserB {
    Vault public first;
    Vault public second;

    function run(uint256 v) external pure returns (uint256) {
        return twice(twice(v));
    }
}

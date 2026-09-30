// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IfVault, ifDouble, IfTooBig, IF_LIMIT} from "./IfBase.sol";

// IfVault, ifDouble and IF_LIMIT in a comment are not uses.
contract IfUserA {
    IfVault public vault;
    string public constant NAME = "IfVault ifDouble IF_LIMIT";

    function check(uint256 v) external pure returns (uint256) {
        if (v > IF_LIMIT) revert IfTooBig(v);
        return ifDouble(v);
    }

    function shadow(uint256 IF_LIMIT) external pure returns (uint256) {
        return IF_LIMIT + 1;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

uint256 constant IF_LIMIT = 10;

error IfTooBig(uint256 value);

function ifDouble(uint256 v) pure returns (uint256) {
    return v * 2;
}

contract IfVault {
    function limit() external pure returns (uint256) {
        return IF_LIMIT;
    }
}

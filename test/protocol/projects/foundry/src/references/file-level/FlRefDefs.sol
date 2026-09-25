// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

uint256 constant FL_LIMIT = 5;

// flScale multiplies by FL_LIMIT.
function flScale(uint256 a) pure returns (uint256) {
    return a * FL_LIMIT;
}

function flScaleTwice(uint256 a) pure returns (uint256) {
    return flScale(flScale(a));
}

contract FlRefShadow {
    string public constant NOTE = "flScale FL_LIMIT";

    function flScale(uint256 a) internal pure returns (uint256) {
        return a + 1;
    }

    function run(uint256 a) external pure returns (uint256) {
        uint256 FL_LIMIT = 2;
        return flScale(a) * FL_LIMIT;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

function flClamp(uint256 x, uint256 hi) pure returns (uint256) {
    uint256 result = x;
    if (x > hi) {
        uint256 excess = x - hi;
        result = x - excess;
    }
    for (uint256 i = 0; i < 2; i++) {
        uint256 step = i;
        result += step;
    }
    unchecked {
        uint256 wrapped = result + 1;
        result = wrapped - 1;
    }
    return result;
}

function flSplit(uint256 x) pure returns (uint256 hi, uint256 lo) {
    uint256 mid = x / 2;
    hi = x - mid;
    lo = mid;
}

function flTuple(uint256 x) pure returns (uint256) {
    (uint256 first, uint256 second) = flSplit(x);
    (, uint256 onlyLo) = flSplit(first);
    return second + onlyLo;
}

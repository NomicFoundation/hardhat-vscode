// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

function flAdd(uint256 a, uint256 b) pure returns (uint256) {
    return a + b;
}

function flAdd(uint256 a, uint256 b, uint256 c) pure returns (uint256) {
    return flAdd(flAdd(a, b), c);
}

function flNoop() pure {}

function flIsZero(uint256 x) pure returns (bool) {
    return x == 0;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

struct Box {
    uint256 width;
    uint256 height;
}

struct Pair {
    uint256 v;
}

function area(Box memory b) pure returns (uint256) {
    return b.width * b.height;
}

function first(Pair memory p) pure returns (uint256) {
    return p.v;
}

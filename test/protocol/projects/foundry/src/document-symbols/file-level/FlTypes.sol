// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

struct FlPair {
    uint256 left;
    uint256 right;
}

struct FlNested {
    FlPair pair;
    uint256[] values;
    mapping(address => uint256) balances;
    function(uint256) external callback;
}

enum FlState {
    Idle,
    Busy,
    Done
}

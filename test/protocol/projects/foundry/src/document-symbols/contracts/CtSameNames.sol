// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract CtFirst {
    uint256 public total;

    function run() external {
        total += 1;
    }
}

contract CtSecond {
    uint256 public total;

    function run() external {
        uint256 step = 2;
        total += step;
    }
}

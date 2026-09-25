// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

library FnMathLib {
    function twice(uint256 x) internal pure returns (uint256) {
        return x * 2;
    }
}

contract FnVault {
    uint256 public total;

    function deposit(uint256 amount, address to) external payable returns (bool ok) {
        total += amount;
        ok = to != address(0);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

struct Point {
    uint256 x;
    uint256 y;
}

error Oops();

event Ev(uint256 value);

function helper() pure returns (uint256) {
    return 1;
}

contract Token {
    function ping() external {
        emit Ev(1);
    }
}

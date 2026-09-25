// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

struct Point {
    uint256 x;
    uint256 y;
}

error Oops();

// file-level events need 0.8.22

function helper() pure returns (uint256) {
    return 1;
}

contract Token {
    function ping() external {
        payable(msg.sender).transfer(0);
    }
}

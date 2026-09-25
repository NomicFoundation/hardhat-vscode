// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract TransientName {
    uint256 transient;

    function setTransient(uint256 value) external {
        uint256 previous = transient;
        transient = value + previous;
    }
}

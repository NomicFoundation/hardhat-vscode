// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MbTransient {
    uint256 transient lockDepth;
    bool transient entered;
    address public owner;
    uint256 constant LIMIT = 3;
}

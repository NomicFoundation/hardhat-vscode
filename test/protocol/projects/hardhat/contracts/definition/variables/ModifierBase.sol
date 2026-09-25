// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

abstract contract Owned {
    address internal owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract NsTransient {
    bool transient locked;
    uint256 transient depth;
    address transient caller;
    uint256 public stored;
    uint256 public constant LIMIT = 3;
    uint256 public immutable createdAt;

    constructor() {
        createdAt = block.timestamp;
    }

    modifier nonReentrant() {
        require(!locked, "reentrant");
        locked = true;
        _;
        locked = false;
    }

    function enter() external nonReentrant {
        uint256 current = depth + 1;
        depth = current;
        caller = msg.sender;
    }
}

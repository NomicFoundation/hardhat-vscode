// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

abstract contract CtOwned {
    address internal owner;

    constructor(address initialOwner) {
        owner = initialOwner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "owner");
        _;
    }

    function transfer(address to) external virtual;
}

abstract contract CtCounted {
    uint256 internal count;

    constructor(uint256 start) {
        count = start;
    }
}

interface CtIPing {
    function ping() external returns (uint256);
}

contract CtService is
    CtOwned(msg.sender),
    CtCounted,
    CtIPing
{
    uint256 private immutable created;

    constructor(uint256 start) CtCounted(start + 1) {
        created = block.timestamp;
    }

    function transfer(address to) external override onlyOwner {
        owner = to;
    }

    function ping() external override returns (uint256) {
        count += created > 0 ? 1 : 2;
        return count;
    }
}

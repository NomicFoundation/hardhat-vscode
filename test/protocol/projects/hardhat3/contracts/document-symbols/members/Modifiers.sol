// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

abstract contract MbModifierBase {
    modifier onlyOwner() virtual;

    modifier atLeast(uint256 minimum) virtual {
        require(msg.value >= minimum);
        _;
    }
}

contract MbModifiers is MbModifierBase {
    address owner;

    modifier onlyOwner() override {
        require(msg.sender == owner);
        _;
    }

    modifier atLeast(uint256 minimum) override {
        uint256 scaled = minimum * 2;
        require(msg.value >= scaled);
        _;
    }

    modifier bare {
        _;
    }

    function guarded() public payable onlyOwner atLeast(1) bare {}
}

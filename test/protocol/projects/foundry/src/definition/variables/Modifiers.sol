// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {Owned} from "./ModifierBase.sol";

abstract contract Limited is Owned {
    modifier atMost(uint256 cap, uint256 amount) {
        require(amount <= cap, "over cap");
        _;
    }
}

contract Guarded is Limited {
    uint256 private stored;

    modifier nonZero(uint256 amount) {
        require(amount != 0, "zero");
        _;
    }

    function set(uint256 value) external onlyOwner nonZero(value) atMost(1000, value) {
        stored = value;
    }
}

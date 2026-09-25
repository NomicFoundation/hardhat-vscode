// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "hardhat/console.sol";

contract OrConsoleCaller {
    uint256 private _stored;

    function store(uint256 value) external {
        _stored = value;
        console.log("stored");
        console.log("count %d", value);
    }
}

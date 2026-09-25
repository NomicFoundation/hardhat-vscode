// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

abstract contract RvBase {
    uint256 internal constant CAP = 1000;
    uint256 internal reserve;
    address internal immutable admin;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "not admin");
        _;
    }

    modifier within(uint256 limit, uint256 amount) {
        require(limit <= CAP, "cap");
        require(amount <= limit, "over");
        require(amount != 0, "zero");
        _;
    }

    function fee(uint256 amount) internal pure returns (uint256) {
        return (amount * 25) / 10000;
    }
}

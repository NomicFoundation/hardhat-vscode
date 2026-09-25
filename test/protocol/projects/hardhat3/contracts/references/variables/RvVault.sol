// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {RvBase} from "./RvBase.sol";

contract RvVault is RvBase {
    function deposit(uint256 amount) external onlyAdmin within(RvBase.CAP, amount) {
        reserve += amount - fee(amount);
    }

    function withdraw(uint256 amount) external onlyAdmin within(reserve, amount) {
        reserve -= amount;
    }

    function isAdmin(address who) external view returns (bool) {
        return who == admin;
    }

    function preview(uint256 reserve) external pure returns (uint256) {
        return reserve * 2;
    }
}

contract RvOther {
    uint256 public reserve;

    function get() external view returns (uint256) {
        return reserve;
    }
}

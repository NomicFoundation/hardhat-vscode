// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {Price} from "./Price.sol";

contract UsePrice {
    Price public total;

    function deposit(Price amount) external {
        total = total + amount;
    }

    function withdraw(Price amount) external {
        if (amount == Price.wrap(0)) revert();
        total = total - amount;
    }

    function raw() external view returns (uint256) {
        return total.toRaw();
    }
}

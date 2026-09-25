// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {Price, add, sub, eq, toRaw} from "./Price.sol";

contract UsePrice {
    Price public total;

    function deposit(Price amount) external {
        total = add(total, amount);
    }

    function withdraw(Price amount) external {
        Price empty = Price.wrap(0);
        total = eq(amount, empty) ? total : sub(total, amount);
    }

    function raw() external view returns (uint256) {
        return toRaw(total);
    }
}

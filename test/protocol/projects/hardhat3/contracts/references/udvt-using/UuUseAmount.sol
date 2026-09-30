// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {UuAmount as Amt, UuAmountLib} from "./UuAmount.sol";

using UuAmountLib for Amt;

contract UuUseAmount {
    // UuAmount and toUint in a comment
    Amt internal balance;

    function deposit(uint128 raw) external {
        Amt amount = Amt.wrap(raw);
        balance = balance.plus(amount);
    }

    function total() external view returns (uint256) {
        return UuAmountLib.toUint(balance) + balance.toUint();
    }

    function label() external pure returns (string memory) {
        return "toUint of UuAmount";
    }
}

// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "./Imported.sol";

contract ImportTest {
    mapping(address => uint) balance;

    function transfer(address to, uint256 amount) public {
        if (amount > balance[msg.sender]) {
            // Error call using named parameters. Equivalent to
            // revert InsufficientBalance(balance[msg.sender], amount);
            revert InsufficientBalance({
                balance: Balance({
                    available: balance[msg.sender]
                }),
                required: amount
            });
        }

        balance[msg.sender] -= amount;
        balance[to] += amount;
    }
}

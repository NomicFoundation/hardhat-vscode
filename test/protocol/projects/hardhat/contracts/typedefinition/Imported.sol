// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

struct Balance {
    uint256 available;
}

/// Insufficient balance for transfer. Needed `required` but only
/// `available` available.
/// @param balance balance available.
/// @param required requested amount to transfer.
error InsufficientBalance(Balance balance, uint256 required);

contract TestToken {
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

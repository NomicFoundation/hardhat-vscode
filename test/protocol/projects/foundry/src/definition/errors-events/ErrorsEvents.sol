// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IEEVault, EEVaultBase} from "./Base.sol";

contract EEVault is IEEVault, EEVaultBase {
    error ZeroAmount();
    event Paused(address by);

    mapping(address => uint256) private balances;
    address private owner;

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        if (msg.value == 0) revert ZeroAmount();
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, InsufficientBalance(balances[msg.sender], amount));
        balances[msg.sender] -= amount;
        emit Withdrawn(msg.sender, amount);
    }

    function pause() external {
        if (msg.sender != owner) revert Unauthorized(msg.sender);
        emit Paused(msg.sender);
    }

    function selectors() external pure returns (bytes32, bytes4) {
        return (Paused.selector, IEEVault.Unauthorized.selector);
    }
}

contract EEOutsider {
    function notify() external {
        emit IEEVault.Deposited(msg.sender, 0);
    }

    function fail() external pure {
        revert EEVaultBase.InsufficientBalance(0, 1);
    }
}

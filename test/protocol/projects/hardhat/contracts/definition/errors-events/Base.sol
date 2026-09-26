// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

interface IEEVault {
    error Unauthorized(address caller);
    event Deposited(address indexed who, uint256 amount);
}

contract EEVaultBase {
    error InsufficientBalance(uint256 available, uint256 required);
    event Withdrawn(address indexed who, uint256 amount);
}

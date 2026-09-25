// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

error FlTooLarge(uint256 value, uint256 limit);
error FlEmpty();

event FlLogged(address indexed who, uint256 value);
event FlPinged();
event FlAnon(uint256 indexed a) anonymous;

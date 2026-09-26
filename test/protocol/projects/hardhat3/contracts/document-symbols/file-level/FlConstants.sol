// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

type FlAmount is uint128;

uint256 constant FL_LIMIT = 100;
uint256 constant FL_DOUBLE_LIMIT = FL_LIMIT * 2;
bytes32 constant FL_TAG = keccak256("fl");
string constant FL_NAME = "file-level";
address constant FL_OWNER = address(0);
FlAmount constant FL_ZERO = FlAmount.wrap(0);

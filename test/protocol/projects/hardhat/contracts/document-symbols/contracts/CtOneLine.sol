// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract CtTight { uint256 a; function f() public { a = 1; } }

contract CtTighter { uint256 b; } contract CtSameLine { function g() public pure {} }

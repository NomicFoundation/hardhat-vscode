// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract Foo {
  // Constructor quickfixes
  constructor(uint256[] p1, string calldata p2) {}

  // Function parameters and return value quickfixes
  function foo(uint256[] storage p3, string p4)
    public
    returns (bytes, string storage)
  {
    // Variable quickfixes
    uint256 memory singleUint;
  }
}

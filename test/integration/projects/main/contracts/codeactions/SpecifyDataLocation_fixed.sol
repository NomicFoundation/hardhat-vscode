// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract Foo {
  // Constructor quickfixes
  constructor(uint256[] memory p1, string memory p2) {}

  // Function parameters and return value quickfixes
  function foo(uint256[] memory p3, string memory p4)
    public
    returns (bytes memory, string memory )
  {
    // Variable quickfixes
    uint256 singleUint;
  }
}

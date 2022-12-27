// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract Calc {
  /** */
  function sum(uint a, uint b) public pure returns (uint160) {
    return uint160(a + b);
  }

  /** */
  function log(uint a) public pure {
    a;
  }
}

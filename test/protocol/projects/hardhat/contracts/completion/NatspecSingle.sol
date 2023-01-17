// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

///
contract Calc {
  ///
  function sum(uint a, uint b) public pure returns (uint160 retVal) {
    retVal = uint160(a + b);
  }
}

contract MyContract {
  ///
  uint public publicCounter;

  ///
  event MyEvent(uint a, uint b);
}

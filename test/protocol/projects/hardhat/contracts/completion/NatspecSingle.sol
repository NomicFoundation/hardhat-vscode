// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

///
contract Calc {
  ///
  function sum(uint a, uint b) public pure returns (uint160 retVal, uint160) {
    return (1, 2);
  }
}

contract MyContract {
  ///
  uint public publicCounter;

  ///
  event MyEvent(uint a, uint b);
}

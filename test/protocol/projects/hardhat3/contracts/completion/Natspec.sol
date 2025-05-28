// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

/** */
library MyLib {

}

/** */
interface MyInterface {

}

/** */
contract Calc {
  /** */
  function has2Returns(uint a, uint b) public pure returns (uint160 retVal, uint160) {
    return (1, 2);
  }

  /** */
  function has1Return(uint a, uint b) public pure returns (uint160) {
    return uint160(a - b);
  }

  /** */
  function log(uint a) public pure {
    a;
  }
}

contract MyContract {
  /** */
  uint public publicCounter;

  /** */
  uint privateCounter;

  /** */
  event MyEvent(uint a, uint b);
}

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
  function sum(uint a, uint b) public pure returns (uint160 retVal) {
    retVal = uint160(a + b);
  }

  /** */
  function sub(uint a, uint b) public pure returns (uint160) {
    return uint160(a - b);
  }

  /** */
  function log(uint a) public pure {
    a;
  }

  /** */
  function mult(uint a, uint b) private pure returns (uint160 retVal) {
    retVal = uint160(a * b);
  }
}

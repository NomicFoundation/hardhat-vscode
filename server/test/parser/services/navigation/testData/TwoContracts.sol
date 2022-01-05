// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Without {
  function getTen() public pure returns (uint120) {
    return 10;
  }
}

contract WithoutExtended is Without {
    constructor (uint x, uint y) Without() {}
}

contract Foo {
    constructor (uint x) {}
}

contract Bar is Foo {
    constructor (uint x, uint y) Foo(x) {}
}

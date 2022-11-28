// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.8;

import "./Bar.sol";
import "./Baz.sol";
import "../lib/Quz.sol";

contract Foo {
  Bar bar = new Bar();

  Quz quz = new Quz(123242);

  constructor(uint256 baz) {}

  function foo() public returns (uint256) {
    return bar.magic();
  }
}

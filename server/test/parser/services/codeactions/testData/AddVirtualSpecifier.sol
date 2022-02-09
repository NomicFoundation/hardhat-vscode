// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Base {
  function foo() {}

  function bar() public {}

  function baz() public pure {}

  function boz() public pure mathsWorks {}

  function mfoo()
  {}

  function mbar() public
  {}

  function mbaz()
    public
    pure
  {}

  function mboz()
    public
    pure
    mathsWorks
  {}

  modifier mathsWorks() {
    require(25 == 25, "happy");
    _;
  }
}

contract Middle is Base {}

contract Bottom is Middle {
  function foo() public override {}

  function bar() public override {}

  function baz() public pure override {}

  function boz() public pure override mathsWorks {}

  function mfoo() public override {}

  function mbar() public override {}

  function mbaz() public pure override {}

  function mboz() public pure override mathsWorks {}
}

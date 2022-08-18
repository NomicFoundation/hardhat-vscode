// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Base {
  function foo() public virtual {}

  function bar() public virtual {}

  function baz() public pure virtual {}

  function boz() public pure virtual mathsWorks {}

  function mfoo() public virtual
  {}

  function mbar() public virtual
  {}

  function mbaz()
    public
    pure
    virtual
  {}

  function mboz()
    public
    pure
    virtual
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

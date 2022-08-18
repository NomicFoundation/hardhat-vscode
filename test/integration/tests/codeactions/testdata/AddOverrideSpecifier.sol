// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Base {
  function foo() public virtual {}

  function foo2() public virtual {}

  function bar()
    public
    pure
    virtual
    mathsWorks
    returns (string memory outputlong)
  {
    return "pure";
  }

  function withMod() public virtual mathsWorks {}

  function foo3() public virtual {}

  function foo4() public virtual {}

  function foo5() public virtual returns (string memory) {}

  function withAnotherMod() public virtual mathsWorks returns (string memory outputlong) {}

  modifier mathsWorks() {
    require(25 == 25, "happy");
    _;
  }
}

contract Middle is Base {}

contract Bottom is Middle {
  function foo() public {}

  function foo2() public {}

  function bar() public pure returns (string memory) {}

  function withMod() public pure mathsWorks {}

  function foo3() public
  {
  }

  function foo4() public
  {
  }

  function foo5() 
  public
  pure
  returns (string memory) {
  }

  function withAnotherMod()
  public
  mathsWorks
  returns (string memory outputlong)
  {}
}

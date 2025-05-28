// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Base {
  function withAnotherMod()
    public
    virtual
    mathsWorks
    returns (string memory outputlong)
  {}

  modifier mathsWorks() {
    require(25 == 25, "happy");
    _;
  }
}

contract Middle is Base {}

contract Bottom is Middle {
  function withAnotherMod()
    public
    mathsWorks
    returns (string memory outputlong)
  {}
}

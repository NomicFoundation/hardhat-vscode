// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

interface IFooBase {
  function baseFunction() external;
}

interface IFoo is IFooBase {
  function myFunction() external;
}

contract Foo is IFoo {
  function myFunction() public override {}

  function baseFunction() external override {}
}

contract Bar is IFoo {
  function myFunction() public override {}

  function baseFunction() external override {}
}

abstract contract BazBase {
  function baseFunction() external virtual;
}

abstract contract Baz is BazBase {
  function myFunction() external virtual;
}

contract Bof is Baz {
  function myFunction() public override {}

  function baseFunction() external virtual override {}
}

contract Bif is Baz {
  function myFunction() public override {}

  function baseFunction() external virtual override {}
}

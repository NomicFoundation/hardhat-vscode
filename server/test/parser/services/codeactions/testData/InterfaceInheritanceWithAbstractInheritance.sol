// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

interface IExample {
  function first() external;

  function second() external;
}

abstract contract Parent is IExample {
  function first() public virtual override {}
}

contract Child is IExample, Parent {
  // function second() external override {}
}

// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./Parent.sol";

contract Child is Parent {
  constructor() Parent() {}
}

contract Another {
  function createParent() public {
    new Parent();
  }
}

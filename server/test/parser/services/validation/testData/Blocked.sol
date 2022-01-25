// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Alpha {
  function foo() public virtual {}

  function bar() public virtual {}
}

contract Beta {
  function foo() public virtual {}
}

contract Omega is Alpha, Beta {
  function foo() public {}

  function bar() public {}
}

// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Alpha {
  function foo() public virtual {}

  function baz() public virtual {}
}

contract Beta {
  function baz() public virtual {}
}

contract Gamma {
  function foo() public virtual {}

  function baz() public virtual {}
}

contract Omega is Alpha, Beta, Gamma {
  function foo() public {}

  function baz() public virtual override(Alpha) {}
}

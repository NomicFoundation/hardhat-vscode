// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract Greeter {
  string public greeting = 'hi';

  function greet(string memory greeting, string memory who) public pure returns (bool) {
    return true;
  }
}

contract SomeOther {
  Greeter greeter;

  function foo() public {
    greeter.greeting;
  }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import './Greeter.sol';

contract GreeterUser {
  Greeter greeter;

  function foo() public {
    greeter.greeting;
    greeter.greet('hi', 'john');
  }
}

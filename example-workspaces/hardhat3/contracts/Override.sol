// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract A {
    function example() public virtual returns (uint256) {}
}

contract B {
    function example() public virtual returns (uint256) {}
}

contract C {
    function example() public virtual returns (uint256) {}
}

contract D is A, B, C {
    function example() public override(A, B, C) returns (uint256) {}
}

// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

// a*  b*         c
// |   | \  \     |
// d*  e   f*  g  h
//  \  |  /  /
//     I

interface A {
  function getBalance() external returns (uint120);
}

interface B {
  function getBalance() external returns (uint120);
}

interface C {}

interface D is A {
  function getBalance() external override returns (uint120);
}

interface E is B {}

interface F is B {
  function getBalance() external override returns (uint120);
}

interface G is B {}

interface H is C {}

contract I is D, E, F, G, H {}

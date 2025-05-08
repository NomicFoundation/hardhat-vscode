// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

interface ICounter {
    function increment() external pure;
}

contract Counter is ICounter {
  function increment() external pure override {}
}

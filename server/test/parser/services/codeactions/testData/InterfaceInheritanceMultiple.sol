// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

interface IDiamondCounter {
  function getBalance() external returns (uint120);
}

interface IDiamondIncrement is IDiamondCounter {
  function getBalance() external view override returns (uint120);

  function increment() external;
}

interface IDiamondDecrement is IDiamondCounter {
  function decrement() external;

  function increment() external view;
}

contract DiamondCounter is IDiamondIncrement, IDiamondDecrement {
  uint120 public balance = 0;
}

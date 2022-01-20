// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

interface BaseInterface {
  function inBase() external;
}

interface ExtendingInterface is BaseInterface {
  function inExtender() external;
}

contract ImplementingContract is ExtendingInterface {
  //   function inBase() external override {}
  //   function inExtender() external override {}
}

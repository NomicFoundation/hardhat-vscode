// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "";
import ".";
import "./";
import "./sub/";
import "./sub/subsub/";
import "./sub/subsub/.";

contract Base {
  function bar() public pure virtual returns (string memory outputlong) {
    return "";
  }
}

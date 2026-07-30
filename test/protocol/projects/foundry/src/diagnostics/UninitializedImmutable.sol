// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.3;

// solc error 2658. Note it was removed in solc 0.8.21 - this project pins
// 0.8.8 in foundry.toml, so the error is still emitted here.
contract Bad {
  uint256 public immutable broken;
  uint256 public immutable assignedInConstructor;

  constructor(uint256 _a) {
    assignedInConstructor = _a;
  }
}

// Compiles fine: `ok` has no inline initializer but the constructor assigns it.
contract Good {
  uint256 public immutable ok;

  constructor(uint256 _ok) {
    ok = _ok;
  }
}

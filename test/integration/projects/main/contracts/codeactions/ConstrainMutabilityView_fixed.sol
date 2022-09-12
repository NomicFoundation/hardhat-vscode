// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

contract ConstrainMutability {
  string message;

  function getMessage() private view returns (string memory input) {
    return message;
  }
}

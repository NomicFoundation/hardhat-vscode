// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

contract ConstrainMutability {
  string message;

  function setMessageHello() public {
    message = "hello";
  }

  function getMessage() private returns (string memory input) {
    return message;
  }

  function getPure() private returns (string memory input) {
    return "another";
  }

  function modifyPure() private view returns (string memory input) {
    return "another";
  }
}

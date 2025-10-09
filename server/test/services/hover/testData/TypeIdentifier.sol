// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

contract BaseContract {
  uint256 public value;
}

contract TypeIdentifierTest {
  struct UserInfo {
    address addr;
    string name;
  }

  struct ComplexData {
    UserInfo info;
    mapping(uint256 => bool) flags;
    uint256[] scores;
  }

  ComplexData public data;

  function processData(ComplexData memory input) public {
    // function body
  }

  enum Status {
    Pending,
    Active,
    Completed
  }
  Status public currentStatus;

  BaseContract public baseContract;
}

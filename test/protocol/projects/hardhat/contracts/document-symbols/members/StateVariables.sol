// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract MbTarget {}

contract MbStateVars {
    uint256 plain;
    uint256 public publicCounter;
    address private secret;
    bool internal flag;
    mapping(address => uint256) public balances;
    uint256[] public history;
    MbTarget target = new MbTarget();
    function(uint256) external returns (uint256) handler;
    string public name = "members";
}

contract MbConstants {
    uint256 constant MAX_SUPPLY = 1000;
    uint256 public constant FEE_BPS = 30;
    bytes32 private constant SALT = keccak256("salt");
    address immutable deployer;
    uint256 public immutable createdAt;

    constructor() {
        deployer = msg.sender;
        createdAt = block.timestamp;
    }
}

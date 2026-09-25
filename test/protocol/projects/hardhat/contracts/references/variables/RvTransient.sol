// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract RvStateKinds {
    uint256 public constant LIMIT = 100;
    address public immutable deployer;
    uint256 transient counter;

    constructor() {
        deployer = msg.sender;
    }

    function isDeployer(address who) external view returns (bool) {
        return who == deployer;
    }

    function bump() external returns (uint256) {
        counter += 1;
        return counter * LIMIT;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

contract NsLayoutBase {
    uint256 internal baseValue;
}

contract NsLayout layout at 0x1234 {
    uint256 public counter;
    mapping(address => uint256) internal balances;

    event Bumped(uint256 by);

    function bump(uint256 by) external {
        uint256 next = counter + by;
        counter = next;
        emit Bumped(by);
    }
}

contract NsLayoutChild is NsLayoutBase layout at 0x80 {
    uint256 private childValue;

    constructor() {
        uint256 start = 7;
        childValue = start;
        baseValue = start;
    }
}

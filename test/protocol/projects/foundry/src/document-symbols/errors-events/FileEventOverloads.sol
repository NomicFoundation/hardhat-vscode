// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

event EEOverloaded(address indexed who);
event EEOverloaded(address indexed who, uint256 amount);

contract EEShadow {
    event EEOverloaded(uint256 code);

    function go() external {
        emit EEOverloaded(1);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

event EEFileEvent(address indexed who);
event EEFileAnon(uint256 value) anonymous;
error EEFileEventError(uint256 code);

contract EEFileEventUser {
    function go() external {
        emit EEFileEvent(msg.sender);
        emit EEFileAnon(1);
    }
}

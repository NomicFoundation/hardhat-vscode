// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

event NsFileLevelPing(uint256 id);

interface NsEvents {
    event NsPinged(address indexed from, uint256 id);
    error NsPingFailed(uint256 id);
}

library NsEventLib {
    event NsLibPinged(uint256 id);
}

contract NsEmitter {
    uint256 public count;

    function ping() external {
        uint256 id = ++count;
        emit NsEvents.NsPinged(msg.sender, id);
        emit NsEventLib.NsLibPinged(id);
        emit NsFileLevelPing(id);
    }
}

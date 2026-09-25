// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {RnIpShared as RnIpRemote} from "./shared/RnIpShared.sol";

contract RnIpRemapUser {
    RnIpRemote private _remote;

    function touch() public view returns (uint256) {
        return _remote.rnIpTouch();
    }

    function remote() public view returns (RnIpRemote) {
        return _remote;
    }
}

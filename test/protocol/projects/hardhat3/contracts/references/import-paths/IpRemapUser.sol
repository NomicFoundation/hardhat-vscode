// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "ipref-remapped/IpRemapped.sol";

contract IpRemapUser {
    IpRemapped private _viaRemapping;

    function read() public view returns (uint256) {
        return _viaRemapping.ipValue();
    }
}

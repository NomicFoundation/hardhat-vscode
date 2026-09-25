// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "../../IpBase.sol";

contract IpDeep {
    IpBase private _base;

    function make() public returns (IpBase) {
        _base = new IpBase();
        return _base;
    }
}

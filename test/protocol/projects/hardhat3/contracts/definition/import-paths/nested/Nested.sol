// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "../Target.sol";

contract Nested {
    Target private _target;

    function pingTarget() public view returns (uint256) {
        return _target.ping();
    }
}

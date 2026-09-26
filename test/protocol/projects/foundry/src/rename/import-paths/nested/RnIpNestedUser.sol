// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {RnIpShared} from "../shared/RnIpShared.sol";

contract RnIpNestedUser {
    RnIpShared private _shared = new RnIpShared();

    function touch() public view returns (uint256) {
        return _shared.rnIpTouch();
    }
}

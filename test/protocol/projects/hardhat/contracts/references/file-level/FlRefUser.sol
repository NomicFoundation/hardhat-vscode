// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {FL_LIMIT as FL_CAP, flScale} from "./FlRefDefs.sol";

function flCapped(uint256 a) pure returns (uint256) {
    return a > FL_CAP ? FL_CAP : flScale(a);
}

contract FlRefUser {
    function scaled(uint256 a) external pure returns (uint256) {
        return flScale(a) + flCapped(FL_CAP);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

type FlCount is uint256;

function flInc(FlCount c) pure returns (FlCount) {
    return FlCount.wrap(FlCount.unwrap(c) + 1);
}

function flIsSet(FlCount c) pure returns (bool) {
    return FlCount.unwrap(c) != 0;
}

library FlMath {
    function flHalf(uint256 x) internal pure returns (uint256) {
        return x / 2;
    }
}

using {flInc, flIsSet} for FlCount global;
using FlMath for uint256;

contract FlCounter {
    FlCount public count;

    function bump(uint256 by) external {
        count = count.flInc();
        uint256 half = by.flHalf();
        half;
    }
}

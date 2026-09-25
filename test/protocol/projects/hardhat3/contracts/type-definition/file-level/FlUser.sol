// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./FlDefs.sol";

function flArea(FlBox memory b) pure returns (FlAmount) {
    return FlAmount.wrap(b.corner.x * b.corner.y);
}

using {flArea} for FlBox;

contract FlUser {
    FlBox internal stored;

    function build() external {
        FlPoint memory start = flOrigin();
        stored = flMake(start);
        FlShade tone = stored.shade;
        (FlPoint memory corner, ) = flSplit(stored);
        stored.shade = tone;
        stored.corner = corner;
    }

    function measure() external view returns (uint256) {
        FlAmount area = stored.flArea();
        FlAmount w = flWeigh(stored);
        uint256 total = FlAmount.unwrap(area) + FlAmount.unwrap(w);
        return total + FlAmount.unwrap(FL_UNIT) + FL_LIMIT;
    }
}

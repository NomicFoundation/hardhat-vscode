// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./FileLevelDefs.sol";

// using {shift, sum} for Point; needs 0.8.13
// using PointLib for Point; needs 0.8.13 at file level

contract FileLevelUser is IMoved {
    Color public color = Color.Green;

    function move(Point memory p, uint256 n) external returns (uint256) {
        if (n > MAX_ITEMS) revert TooMany(n);
        Point memory q = shift(p,twice(n));
        emit Moved(q.x, q.y);
        return sum(q) + PointLib.manhattan(q);
    }
}

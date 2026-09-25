// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./FileLevelDefs.sol";

using {shift, sum} for Point;
using PointLib for Point;

contract FileLevelUser {
    Color public color = Color.Green;

    function move(Point memory p, uint256 n) external returns (uint256) {
        if (n > MAX_ITEMS) revert TooMany(n);
        Point memory q = p.shift(twice(n));
        emit Moved(q.x, q.y);
        return q.sum() + q.manhattan();
    }
}

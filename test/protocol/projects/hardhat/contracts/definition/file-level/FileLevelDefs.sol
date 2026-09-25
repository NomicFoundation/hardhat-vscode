// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

uint256 constant MAX_ITEMS = 10;

struct Point {
    uint256 x;
    uint256 y;
}

enum Color {
    Red,
    Green
}

error TooMany(uint256 count);

interface IMoved { event Moved(uint256 x, uint256 y); }

function twice(uint256 a) pure returns (uint256) {
    return a * 2;
}

function quadruple(uint256 a) pure returns (uint256) {
    return twice(twice(a));
}

function shift(Point memory p, uint256 d) pure returns (Point memory) {
    return Point(p.x + d, p.y + d);
}

function sum(Point memory p) pure returns (uint256) {
    return p.x + p.y;
}

library PointLib {
    function manhattan(Point memory p) internal pure returns (uint256) {
        return p.x + p.y;
    }
}

// using {sum} for Point; needs 0.8.13

contract FileLevelLocal {
    function capped(uint256 n) external pure returns (uint256) {
        if (n > MAX_ITEMS) revert TooMany(n);
        return twice(n);
    }

    function total(Point memory p) external pure returns (uint256) {
        return sum(p);
    }
}

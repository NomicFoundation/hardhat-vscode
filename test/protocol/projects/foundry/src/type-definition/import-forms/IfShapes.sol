// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

struct IfPoint {
    uint256 x;
    uint256 y;
}

enum IfColor {
    Red,
    Blue
}

type IfAmount is uint256;

interface IfIToken {
    function balanceOf(address who) external view returns (uint256);
}

library IfMath {
    function origin() internal pure returns (IfPoint memory) {
        return IfPoint(0, 0);
    }
}

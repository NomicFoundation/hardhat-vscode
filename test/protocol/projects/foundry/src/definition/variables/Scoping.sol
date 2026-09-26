// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract Scoping {
    uint256 public total;
    uint256 public count;

    function sibling(bool flag) external pure returns (uint256) {
        if (flag) {
            uint256 x = 1;
            return x;
        } else {
            uint256 x = 2;
            return x + 10;
        }
    }

    function nested() external pure returns (uint256) {
        uint256 y = 1;
        uint256 r;
        {
            uint256 y = 2;
            r = y * 3;
        }
        return r + y;
    }

    function localShadowsState() external pure returns (uint256) {
        uint256 total = 5;
        return total + 1;
    }

    function paramShadowsState(uint256 count) external pure returns (uint256) {
        return count + 1;
    }

    function named(uint256 a) external pure returns (uint256 doubled) {
        doubled = a * 2;
    }

    function loop(uint256 n) external pure returns (uint256 sum) {
        for (uint256 i = 0; i < n; i++) {
            sum += i;
        }
    }
}

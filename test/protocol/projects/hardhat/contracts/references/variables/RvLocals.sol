// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract RvLocals {
    uint256 public total;

    function accumulate(uint256[] calldata xs) external returns (uint256 sum) {
        for (uint256 i = 0; i < xs.length; i++) {
            sum += xs[i];
        }
        total += sum;
    }

    function reset() external {
        delete total;
    }

    function shadow() external pure returns (uint256) {
        uint256 total = 3;
        total *= 2;
        return total;
    }

    function split(uint256 v) external pure returns (uint256 hi, uint256 lo) {
        (uint256 h, uint256 l) = (v / 256, v % 256);
        hi = h;
        lo = l;
        unchecked {
            hi = hi + l;
        }
    }

    function blocks(bool flag) external pure returns (uint256 r) {
        uint256 k = 1;
        if (flag) {
            uint256 k2 = k + 1;
            r = k2 * k2;
        } else {
            uint256 k2 = k + 2;
            r = k2;
        }
        return r + k;
    }
}

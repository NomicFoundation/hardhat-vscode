// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

struct FnOvSmall {
    uint256 value;
}

struct FnOvLarge {
    uint256 value;
    uint256 extra;
}

contract FnOverloads {
    function pick(uint256 a) public pure returns (FnOvSmall memory) {
        return FnOvSmall(a);
    }

    function pick(uint256 a, uint256 b) public pure returns (FnOvLarge memory) {
        return FnOvLarge(a, b);
    }

    function useSecond() external pure returns (uint256) {
        FnOvLarge memory large = pick(1, 2);
        return large.extra;
    }
}

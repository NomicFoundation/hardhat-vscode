// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract LcBlocks {
    function flat(uint256 input) public pure returns (uint256) {
        uint256 doubled = input * 2;
        bool isBig = doubled > 100;
        return isBig ? doubled : input;
    }

    function nested(uint256 input) public pure returns (uint256) {
        uint256 outer = input;
        {
            uint256 inner = outer + 1;
            {
                uint256 innermost = inner + 1;
                outer = innermost;
            }
        }
        return outer;
    }

    function branches(uint256 input) public pure returns (uint256) {
        if (input > 10) {
            uint256 high = input - 10;
            return high;
        } else if (input > 5) {
            uint256 middle = input - 5;
            return middle;
        } else {
            uint256 low = input;
            return low;
        }
    }

    function loops(uint256 n) public pure returns (uint256) {
        uint256 sum = 0;
        for (uint256 i = 0; i < n; i++) {
            uint256 square = i * i;
            sum += square;
        }
        uint256 count = n;
        while (count > 0) {
            uint256 step = 1;
            count -= step;
        }
        do {
            uint256 once = 1;
            sum += once;
        } while (false);
        return sum;
    }

    function wrapping(uint256 a) public pure returns (uint256) {
        unchecked {
            uint256 wrapped = a + 1;
            return wrapped;
        }
    }

    function siblings(bool flag) public pure returns (uint256) {
        if (flag) {
            uint256 value = 1;
            return value;
        } else {
            uint256 value = 2;
            return value;
        }
    }
}

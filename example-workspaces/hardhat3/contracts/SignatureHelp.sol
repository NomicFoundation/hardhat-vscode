// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Example {
    function needsHelp(
        uint256 first,
        uint256 second,
        uint256 third
    ) public pure returns (uint256 output) {
        return first + second + third;
    }

    function usage() public pure returns (uint256 output) {
        return needsHelp(1, 1, 1);
    }
}

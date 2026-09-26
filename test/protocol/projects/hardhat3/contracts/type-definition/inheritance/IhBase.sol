// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

interface IhIToken {
    function peer() external view returns (IhIToken);
}

library IhMath {
    function twice(uint256 x) internal pure returns (uint256) {
        return x * 2;
    }
}

abstract contract IhBase {
    IhIToken internal token;

    function self() public view virtual returns (IhBase) {
        return this;
    }
}

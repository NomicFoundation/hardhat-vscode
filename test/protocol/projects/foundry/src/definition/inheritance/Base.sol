// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

interface IBase {
    function value() external view returns (uint256);
}

interface IExtended is IBase {
    function bump() external;
}

abstract contract Base is IExtended {
    uint256 internal stored;

    constructor(uint256 initial) {
        stored = initial;
    }

    function value() public view virtual override returns (uint256) {
        return stored;
    }
}

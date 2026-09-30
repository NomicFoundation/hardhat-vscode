// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

interface IfcShape {
    function area() external view returns (uint256);
}

interface IfcScaled is IfcShape {
    function scale(uint256 factor) external;
}

interface IfcCounter {
    function count() external view returns (uint256);

    function bump() external;

    function set(uint256 value) external;

    function set(address who) external;
}

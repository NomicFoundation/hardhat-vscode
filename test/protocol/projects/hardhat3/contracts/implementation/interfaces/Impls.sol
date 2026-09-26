// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IfcShape, IfcScaled, IfcCounter} from "./Shapes.sol";

contract IfcSquare is IfcShape {
    uint256 internal side = 2;

    function area() external view virtual override returns (uint256) {
        return side * side;
    }
}

contract IfcBigSquare is IfcSquare {
    function area() external view override returns (uint256) {
        return side * side * 4;
    }
}

abstract contract IfcPartial is IfcScaled {
    uint256 internal factor = 1;

    function scale(uint256 newFactor) external override {
        factor = newFactor;
    }
}

contract IfcCircle is IfcPartial {
    function area() external view override returns (uint256) {
        return 3 * factor;
    }
}

contract IfcTally is IfcCounter {
    uint256 public override count;
    address public owner;

    function bump() external {
        count += 1;
    }

    function set(uint256 value) external override {
        count = value;
    }

    function set(address who) external override {
        owner = who;
    }
}

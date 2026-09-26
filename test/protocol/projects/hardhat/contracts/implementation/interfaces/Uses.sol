// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IfcShape, IfcScaled, IfcCounter} from "./Shapes.sol";
import {IfcSquare} from "./Impls.sol";

contract IfcUser {
    function areaAt(address target) external view returns (uint256) {
        return IfcShape(target).area();
    }

    function areaOf(IfcShape shape) external view returns (uint256) {
        return shape.area();
    }

    function squareArea(IfcSquare square) external view returns (uint256) {
        return square.area();
    }

    function rescale(address target) external {
        IfcScaled(target).scale(2);
    }

    function touch(IfcCounter counter) external returns (uint256) {
        counter.bump();
        counter.set(msg.sender);
        return counter.count();
    }
}

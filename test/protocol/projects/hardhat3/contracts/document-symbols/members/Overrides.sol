// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

interface IMbShape {
    function area() external view returns (uint256);

    function label() external view returns (string memory);
}

abstract contract MbShapeBase {
    function describe() public view virtual returns (string memory);

    function hook() internal virtual returns (uint256);

    function scale(uint256 factor) public virtual returns (uint256) {
        return factor;
    }

    function id() public pure virtual returns (uint256) {
        return 1;
    }
}

abstract contract MbOtherBase {
    function id() public pure virtual returns (uint256) {
        return 2;
    }
}

contract MbSquare is MbShapeBase, MbOtherBase, IMbShape {
    uint256 public override area;
    string public override label = "square";

    function describe() public pure override returns (string memory) {
        return "square";
    }

    function hook() internal pure override returns (uint256) {
        return 0;
    }

    function scale(uint256 factor) public pure override returns (uint256) {
        return factor * 2;
    }

    function scale(uint256 factor, uint256 offset) public pure returns (uint256) {
        return factor + offset;
    }

    function id() public pure override(MbShapeBase, MbOtherBase) returns (uint256) {
        return 3;
    }
}

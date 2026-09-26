// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {AbShape, AbScaled} from "./Shapes.sol";

contract AbSquare is AbScaled {
    function area() public view override returns (uint256) {
        return size * size;
    }

    function describe() public view override returns (uint256) {
        return super.describe() + 1;
    }

    modifier guarded() override {
        require(size > 1, "small");
        _;
    }

    function grow() public guarded {
        size += 1;
    }
}

contract AbCircle is AbShape {
    function area() public view virtual override returns (uint256) {
        return size * 3;
    }
}

contract AbRing is AbCircle {
    function area() public view override returns (uint256) {
        return super.area() - 1;
    }
}

abstract contract AbRoot {
    function tag() public pure virtual returns (uint256);
}

abstract contract AbLeft is AbRoot {
    function tag() public pure virtual override returns (uint256) {
        return 1;
    }
}

abstract contract AbRight is AbRoot {
    function tag() public pure virtual override returns (uint256) {
        return 2;
    }
}

contract AbJoin is AbLeft, AbRight {
    function tag() public pure override(AbLeft, AbRight) returns (uint256) {
        return super.tag() + 10;
    }
}

contract AbUser {
    function measure(AbShape shape) public view returns (uint256) {
        return shape.area() + shape.describe() + shape.fixedSize();
    }

    function tagOf(AbRoot root) public pure returns (uint256) {
        return root.tag();
    }
}

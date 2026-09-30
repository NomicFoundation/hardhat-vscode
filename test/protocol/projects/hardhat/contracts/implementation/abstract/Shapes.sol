// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

abstract contract AbShape {
    uint256 internal size;

    function area() public view virtual returns (uint256);

    function describe() public view virtual returns (uint256) {
        return size;
    }

    function fixedSize() public view returns (uint256) {
        return size;
    }

    modifier guarded() virtual {
        require(size > 0, "empty");
        _;
    }

    function shrink() public guarded {
        size -= 1;
    }
}

abstract contract AbScaled is AbShape {
    function describe() public view virtual override returns (uint256) {
        return super.describe() * 2;
    }
}

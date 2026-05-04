// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract DiamondBase {
    function shared() public pure virtual returns (uint256) {
        return 0;
    }
}

contract DiamondLeft is DiamondBase {
    function leftOnly() public pure returns (uint256) {
        return 1;
    }

    function shared() public pure virtual override returns (uint256) {
        return 10;
    }
}

contract DiamondRight is DiamondBase {
    function rightOnly() public pure returns (uint256) {
        return 2;
    }

    function shared() public pure virtual override returns (uint256) {
        return 20;
    }
}

contract Diamond is DiamondLeft, DiamondRight {
    function shared() public pure override(DiamondLeft, DiamondRight) returns (uint256) {
        return 100;
    }

    function callLeftOnly() public pure returns (uint256) {
        return leftOnly();
    }

    function calculate(uint256 x) public pure returns (uint256) {
        return x * 2;
    }

    function calculate(uint256 x, uint256 y) public pure returns (uint256) {
        return x + y;
    }

    function testOverloads() public pure returns (uint256) {
        uint256 a = calculate(5);
        uint256 b = calculate(2, 3);
        return a + b;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

library CtMath {
    uint256 internal constant SCALE = 1e18;

    struct CtFraction {
        uint256 num;
        uint256 den;
    }

    error CtDivByZero();

    function mul(CtFraction memory a, uint256 x) internal pure returns (uint256) {
        uint256 scaled = x * a.num;
        return scaled / a.den;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        if (b == 0) revert CtDivByZero();
        return (a * SCALE) / b;
    }
}

contract CtUsesMath {
    using CtMath for CtMath.CtFraction;

    CtMath.CtFraction private half = CtMath.CtFraction(1, 2);

    function halve(uint256 x) external view returns (uint256) {
        return half.mul(x);
    }
}

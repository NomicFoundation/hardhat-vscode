// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

library TyMath {
    type TyFixed is int256;

    enum TyRounding {
        Down,
        Up
    }

    struct TyFraction {
        uint128 num;
        uint128 den;
    }

    function ratio(TyFraction memory f) internal pure returns (uint256) {
        return uint256(f.num) / uint256(f.den);
    }
}

interface ITyOracle {
    type TyTick is int24;

    enum TyFeed {
        Spot,
        Twap
    }

    struct TyQuote {
        uint256 price;
        uint64 stamp;
    }

    function quote(TyFeed feed) external view returns (TyQuote memory);
}

contract TyUser {
    TyMath.TyFraction internal fraction;

    ITyOracle.TyQuote internal last;

    TyMath.TyFixed internal offset;
}

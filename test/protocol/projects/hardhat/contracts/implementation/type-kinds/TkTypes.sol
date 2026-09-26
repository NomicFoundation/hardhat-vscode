// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

struct TkPoint {
    uint256 x;
    uint256 y;
}

struct TkSegment {
    TkPoint start;
    TkPoint end;
}

enum TkColor {
    Red,
    Green
}

type TkPrice is uint256;

error TkTooLow(uint256 value);

function tkOrigin() pure returns (TkPoint memory origin) {
    origin = TkPoint(0, 0);
}

function tkDouble(TkPrice price) pure returns (TkPrice) {
    return TkPrice.wrap(TkPrice.unwrap(price) * 2);
}

contract TkVault {
    uint256 public total;

    function deposit(uint256 amount) external {
        if (amount == 0) revert TkTooLow(amount);
        total += amount;
    }
}

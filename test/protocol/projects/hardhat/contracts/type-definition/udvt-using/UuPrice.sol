// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

type UuPrice is uint256;

using {uuAdd as +, uuEq as ==, uuDouble, uuRaw} for UuPrice global;

function uuAdd(UuPrice a, UuPrice b) pure returns (UuPrice) {
    return UuPrice.wrap(UuPrice.unwrap(a) + UuPrice.unwrap(b));
}

function uuEq(UuPrice a, UuPrice b) pure returns (bool) {
    return UuPrice.unwrap(a) == UuPrice.unwrap(b);
}

function uuDouble(UuPrice a) pure returns (UuPrice) {
    return a + a;
}

function uuRaw(UuPrice a) pure returns (uint256) {
    return UuPrice.unwrap(a);
}

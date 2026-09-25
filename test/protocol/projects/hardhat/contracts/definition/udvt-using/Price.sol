// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

type Price is uint256;

// File-level `using` and user-defined operators need 0.8.13 and 0.8.19.

function add(Price a, Price b) pure returns (Price) {
    return Price.wrap(Price.unwrap(a) + Price.unwrap(b));
}

function sub(Price a, Price b) pure returns (Price) {
    return Price.wrap(Price.unwrap(a) - Price.unwrap(b));
}

function eq(Price a, Price b) pure returns (bool) {
    return Price.unwrap(a) == Price.unwrap(b);
}

function toRaw(Price a) pure returns (uint256) {
    return Price.unwrap(a);
}

function double(Price a) pure returns (Price) {
    return add(a, a);
}

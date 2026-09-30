// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

type Price is uint256;

using {add as +, sub as -, eq as ==, toRaw} for Price global;

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
    return a + a;
}

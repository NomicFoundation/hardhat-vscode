// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

type NsFixed is int256;

using {nsAdd as +, nsEq as ==, nsNeg as -} for NsFixed global;
using NsFixedLib for NsFixed global;

function nsAdd(NsFixed a, NsFixed b) pure returns (NsFixed) {
    int256 sum = NsFixed.unwrap(a) + NsFixed.unwrap(b);
    return NsFixed.wrap(sum);
}

function nsEq(NsFixed a, NsFixed b) pure returns (bool) {
    return NsFixed.unwrap(a) == NsFixed.unwrap(b);
}

function nsNeg(NsFixed a) pure returns (NsFixed) {
    return NsFixed.wrap(-NsFixed.unwrap(a));
}

library NsFixedLib {
    function isZero(NsFixed a) internal pure returns (bool) {
        return NsFixed.unwrap(a) == 0;
    }
}

contract NsFixedUser {
    using NsFixedLib for NsFixed;

    NsFixed public total;

    function add(NsFixed x) external returns (bool) {
        NsFixed next = total + x;
        NsFixed flipped = -next;
        total = next;
        return flipped == x || next.isZero();
    }
}

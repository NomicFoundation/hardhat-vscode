// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

type UuAmount is uint128;

library UuAmountLib {
    function toUint(UuAmount a) internal pure returns (uint256) {
        return UuAmount.unwrap(a);
    }

    function plus(UuAmount a, UuAmount b) internal pure returns (UuAmount) {
        return UuAmount.wrap(UuAmount.unwrap(a) + UuAmount.unwrap(b));
    }
}

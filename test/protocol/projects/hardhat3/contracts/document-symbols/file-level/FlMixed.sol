// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {FlPair} from "./FlTypes.sol";

uint256 constant FL_MAX = 5;

interface IFlSource {
    function flValue() external view returns (uint256);
}

type FlId is uint64;

error FlOutOfRange(uint256 value);

abstract contract FlBase {
    uint256 internal stored;

    function flValue() public view virtual returns (uint256);
}

event FlChanged(uint256 value);

function flCap(uint256 x) pure returns (uint256) {
    return x < FL_MAX ? x : FL_MAX;
}

using {flCap} for uint256;

contract FlMixedImpl is FlBase, IFlSource {
    uint256 internal limit = FL_MAX;

    function flValue() public view override(FlBase, IFlSource) returns (uint256) {
        uint256 capped = stored.flCap();
        return capped;
    }
}

struct FlRecord {
    FlId id;
    FlPair pair;
}

enum FlMode {
    Off,
    On
}

library FlLib {}

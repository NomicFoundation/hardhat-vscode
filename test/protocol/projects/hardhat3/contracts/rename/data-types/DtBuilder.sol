// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {Box, Pair, area} from "./DtShapes.sol";

contract DtBuilder {
    struct Pair {
        uint256 v;
        uint256 w;
    }

    Box internal stored;

    function make() external returns (uint256) {
        Box memory b = Box({width: 2, height: 3});
        stored = b;
        return area(b) + stored.width;
    }

    // Pair here is the contract's own Pair, not the file-level one.
    function local() external pure returns (uint256) {
        Pair memory q = Pair({v: 1, w: 2});
        return q.v + q.w;
    }
}

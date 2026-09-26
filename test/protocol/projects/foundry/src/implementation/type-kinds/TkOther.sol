// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./TkTypes.sol";
import "./TkShapes.sol";

contract TkOther {
    struct Inner {
        bool flag;
    }

    Inner public own;
    TkShapes.Inner public borrowed;

    function record(TkSegment calldata s, TkShapes shapes) external returns (Inner memory result) {
        TkPoint memory a = s.start;
        result = Inner(a.x == 0);
        TkVault(address(shapes.vault())).deposit(1);
    }

    function toggle(TkPrice p) external pure returns (TkPrice) {
        return tkDouble(p);
    }
}

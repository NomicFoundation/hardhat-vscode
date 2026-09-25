// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IfPoint} from "./IfShapes.sol";
import {IfPoint as IfGeoPoint} from "./IfOther.sol";
import {IfAmount as IfWei} from "./IfShapes.sol";
import * as M from "./IfShapes.sol";
import "./IfShapes.sol" as N;
import "./IfMid.sol";

contract IfImporter {
    IfPoint public here;
    IfGeoPoint public there;
    IfWei public fee;
    M.IfPoint public viaStar;
    N.IfColor public viaAs;
    IfDeepRecord public record;

    function sum() external view returns (uint256) {
        return here.x + uint256(there.lat) + IfWei.unwrap(fee) + viaStar.y;
    }

    function probe(address target) external view returns (uint256) {
        M.IfIToken itok = M.IfIToken(target);
        return itok.balanceOf(address(this));
    }

    function isGold() external view returns (bool) {
        return record.kind == IfDeepKind.Gold;
    }

    function start() external pure returns (M.IfPoint memory) {
        return M.IfMath.origin();
    }

    function geo() external view returns (IfGeoPoint memory) {
        return there;
    }
}

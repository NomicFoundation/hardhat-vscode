// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {Token} from "./Lib.sol";
import {Token as OtherToken} from "./Other.sol";
import * as M from "./Lib.sol";
import "./Lib.sol" as N;
import "./Mid.sol";

contract Importer {
    Token public token;
    OtherToken public other;
    M.Token public viaModule;
    Deep public deep;

    function point() external pure returns (M.Point memory) {
        return M.Point(1, 2);
    }

    function viaStar() external pure returns (uint256) {
        return M.helper();
    }

    function viaAs() external pure returns (uint256) {
        return N.helper();
    }

    function selector() external pure returns (bytes4) {
        return M.Token.ping.selector;
    }

    function fail() external pure {
        revert M.Oops();
    }
}

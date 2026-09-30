// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {EERGGuard as Gate} from "./Guard.sol";

contract EERGClient is Gate {
    function probe(Gate g) external returns (string memory) {
        try g.check(1) {
            return "";
        } catch Error(string memory reason) {
            return reason;
        }
    }

    function last() external view returns (string memory) {
        return reason;
    }

    function fail() external pure {
        revert Gate.Blocked(1, address(0));
    }

    function sel() external pure returns (bytes4) {
        return Gate.Blocked.selector;
    }
}

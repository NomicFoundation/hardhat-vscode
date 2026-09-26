// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

library OrLog {
    function log(uint256 p0) internal pure returns (uint256) {
        return p0;
    }

    function log(string memory p0) internal pure returns (string memory) {
        return p0;
    }
}

contract OrSameArity {
    function run() external pure returns (string memory) {
        return OrLog.log("x");
    }
}

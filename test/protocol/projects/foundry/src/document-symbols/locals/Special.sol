// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

function lcFree(uint256 x) pure returns (uint256) {
    uint256 freeLocal = x + 1;
    return freeLocal;
}

contract LcSpecial {
    uint256 private stored;

    constructor(uint256 initial) {
        uint256 adjusted = initial + 1;
        stored = adjusted;
    }

    modifier bounded(uint256 limit) {
        uint256 cap = limit * 2;
        require(stored <= cap, "over");
        _;
        uint256 afterwards = stored;
        afterwards;
    }

    function guarded() public view bounded(10) returns (uint256) {
        return stored;
    }

    fallback() external {
        uint256 fallbackLocal = stored;
        fallbackLocal;
    }

    receive() external payable {
        uint256 received = msg.value;
        received;
    }
}

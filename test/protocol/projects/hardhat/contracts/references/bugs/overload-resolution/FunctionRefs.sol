// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract FrLedger {
    uint256 internal count;

    // record is named in this comment, which is not a use
    function record(uint256 amount) public returns (uint256) {
        count += amount;
        return count;
    }

    function record(address who) public returns (uint256) {
        return record(uint256(uint160(who)));
    }

    function countdown(uint256 n) internal pure returns (uint256) {
        return n == 0 ? 0 : countdown(n - 1);
    }

    function run() external returns (uint256) {
        string memory label = "record";
        record(msg.sender);
        record(5);
        return countdown(3) + bytes(label).length;
    }
}

contract FrOther {
    function record(uint256 amount) external pure returns (uint256) {
        return amount;
    }

    function useLedger(FrLedger ledger) external returns (uint256) {
        return ledger.record(1) + this.record(2);
    }
}

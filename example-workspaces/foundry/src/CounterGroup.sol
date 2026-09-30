// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Counter} from "@counter/Counter.sol";

/// @notice Owns a set of counters, to give definition and references a cross-file target.
contract CounterGroup {
    Counter[] public counters;

    event CounterAdded(uint256 indexed index, Counter counter);

    function add() public returns (Counter counter) {
        counter = new Counter();
        counters.push(counter);

        emit CounterAdded(counters.length - 1, counter);
    }

    function incrementAll() public {
        for (uint256 i = 0; i < counters.length; i++) {
            counters[i].increment();
        }
    }

    function total() public view returns (uint256 sum) {
        for (uint256 i = 0; i < counters.length; i++) {
            sum += counters[i].number();
        }
    }
}

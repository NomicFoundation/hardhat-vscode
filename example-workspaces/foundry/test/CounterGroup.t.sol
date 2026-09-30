// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {Counter} from "@counter/Counter.sol";
import {CounterGroup} from "@counter/CounterGroup.sol";

contract CounterGroupTest is Test {
    CounterGroup public group;

    function setUp() public {
        group = new CounterGroup();
    }

    function test_IncrementAll() public {
        Counter first = group.add();
        group.add();

        first.setNumber(5);
        group.incrementAll();

        assertEq(group.total(), 7);
    }
}

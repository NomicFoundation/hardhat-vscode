// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.3;

import { Foo, Example as ExampleTest } from './Foo.sol';

contract ImportTest {
    Foo public foo = new Foo();
    ExampleTest private example = new ExampleTest();

    mapping(address => ExampleTest) private exampleTests;

    // Test Foo.sol by getting it's name.
    function getFooName() private view returns (string memory) {
        return foo.name();
    }

    function getExampleTest(address addr) public view returns (string memory) {
        return exampleTests[addr].foo().name();
    }
}

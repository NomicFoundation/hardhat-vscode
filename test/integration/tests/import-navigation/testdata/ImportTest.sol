// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.3;

import { Foo } from './Foo.sol';
import { Ownable as OwnableTest } from "@openzeppelin/contracts/access/Ownable.sol";

contract ImportTest {
    Foo public foo = new Foo();
}

// Make Box inherit from the Ownable contract
contract Box is OwnableTest {
    uint256 private value;
    Import public importContract = new Import();

    event ValueChanged(uint256 newValue);

    // The onlyOwner modifier restricts who can call the store function
    function store(uint256 newValue) public onlyOwner {
        value = newValue;
        emit ValueChanged(newValue);
    }

    function retrieve() public view returns (uint256) {
        return value;
    }
}

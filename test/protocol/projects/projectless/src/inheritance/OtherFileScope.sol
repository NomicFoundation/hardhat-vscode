// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./OtherFileBase.sol";

abstract contract SameFileBase {
    uint256 internal vm;
}

contract OtherFileScope is SameFileBase, OtherFileBase {
    function test() public {
        vm = 2;
    }
}

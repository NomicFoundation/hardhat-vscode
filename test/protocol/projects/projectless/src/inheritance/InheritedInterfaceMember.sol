// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface SafeCheatcodes {
    function label(address account, string calldata newLabel) external;
}

interface Cheatcodes is SafeCheatcodes {
    function prank(address sender) external;
}

contract InheritedInterfaceMember {
    Cheatcodes internal constant vm = Cheatcodes(address(1));

    function testLabel() public {
        vm.label(address(2), "two");
    }
}

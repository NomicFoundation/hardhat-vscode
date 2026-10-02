// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface Cheatcodes {
    function prank(address sender) external;
}

interface SafeCheatcodes {
    function toString(address value) external returns (string memory);
}

abstract contract TestBase {
    Cheatcodes internal constant vm = Cheatcodes(address(1));
}

abstract contract StdUtils {
    SafeCheatcodes private constant vm = SafeCheatcodes(address(1));

    function _toString(address value) internal returns (string memory) {
        return vm.toString(value);
    }
}

contract PrivateBaseMember is TestBase, StdUtils {
    function testPrank() public {
        vm.prank(address(2));
    }
}

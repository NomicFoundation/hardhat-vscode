// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

uint256 constant NS_BASE_SLOT = 0x1000;
string constant NS_NAMESPACE = "example.storage.main";

contract NsAtConstant layout at NS_BASE_SLOT + 2 {
    uint256 public a;
    uint256 internal constant OFFSET = 3;

    function read() external view returns (uint256) {
        uint256 value = a + OFFSET;
        return value;
    }
}

contract NsAtErc7201 layout at erc7201(NS_NAMESPACE) {
    uint256 public b;
    address public owner;
}

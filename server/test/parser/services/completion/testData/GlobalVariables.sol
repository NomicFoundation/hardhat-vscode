// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Test {
    function getSender() public view returns (address) {
        return msg.// <- cursor
    }

    function getBlockTimestamp() public view returns (uint256) {
        return block.// <- cursor
    }

    function getAddressPayable() public view returns (address) {
        return tx.// <- cursor
    }

    function encode() public pure returns (bytes memory) {
        return abi.// <- cursor
    }
}

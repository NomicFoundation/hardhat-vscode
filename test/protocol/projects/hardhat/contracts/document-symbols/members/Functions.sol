// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract MbVisibility {
    function extFn() external {}

    function pubFn() public {}

    function intFn() internal {}

    function privFn() private {}

    function pureFn() public pure returns (uint256) {
        return 1;
    }

    function viewFn() external view returns (address) {
        return address(this);
    }

    function payFn() public payable {}

    function unnamedParams(uint256, address) external pure {}
}

contract MbOverloads {
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;
    }

    function add(uint256 a) internal pure returns (uint256) {
        return a + 1;
    }

    function add(uint256 a, uint256 b, uint256 c) external pure returns (uint256) {
        return a + b + c;
    }
}

contract MbOverloadLocals {
    function pick(uint256 x) public pure returns (uint256) {
        uint256 fromNumber = x;
        return fromNumber;
    }

    function pick(address who) public pure returns (address) {
        address fromAddress = who;
        return fromAddress;
    }

    function pick(bytes32 key, uint256 x) public pure returns (bytes32) {
        return key ^ bytes32(x);
    }
}

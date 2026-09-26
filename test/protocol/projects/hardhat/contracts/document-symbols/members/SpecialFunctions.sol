// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract MbSpecials {
    uint256 received;

    constructor() payable {}

    fallback() external payable {}

    receive() external payable {}
}

contract MbSpecialLocals {
    uint256 total;

    constructor(uint256 seed) {
        uint256 doubled = seed * 2;
        total = doubled;
    }

    fallback(bytes calldata input) external returns (bytes memory output) {
        uint256 size = input.length;
        output = abi.encode(size);
    }

    receive() external payable {
        uint256 amount = msg.value;
        total += amount;
    }
}

contract MbParent {
    uint256 value;

    constructor(uint256 v) {
        value = v;
    }
}

contract MbChild is MbParent {
    constructor() MbParent(7) {}
}

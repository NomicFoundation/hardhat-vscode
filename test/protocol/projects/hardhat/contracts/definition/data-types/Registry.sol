// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract Registry {
    enum Kind {
        Small,
        Big
    }

    struct Entry {
        Kind kind;
        uint256 size;
    }
}

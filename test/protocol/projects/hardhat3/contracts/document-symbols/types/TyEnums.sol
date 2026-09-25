// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

enum TySingle {
    Only
}

enum TyWide {
    North,
    NorthEast,
    East,
    SouthEast,
    South,
    SouthWest,
    West,
    NorthWest
}

contract TyEnumHost {
    enum TyLevel {
        Low,
        Mid,
        High
    }

    TyLevel public level = TyLevel.Mid;
}

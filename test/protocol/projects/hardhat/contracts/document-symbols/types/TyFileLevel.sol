// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

type TyAmount is uint128;

type TyFlag is bool;

type TyKey is bytes32;

enum TyMode {
    Off,
    On,
    Auto
}

struct TyPoint {
    int64 x;
    int64 y;
}

struct TyLine {
    TyPoint head;
    TyPoint tail;
}

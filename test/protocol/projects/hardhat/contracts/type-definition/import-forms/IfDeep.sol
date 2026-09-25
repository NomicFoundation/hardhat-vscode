// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

enum IfDeepKind {
    Plain,
    Gold
}

struct IfDeepRecord {
    uint256 id;
    IfDeepKind kind;
}

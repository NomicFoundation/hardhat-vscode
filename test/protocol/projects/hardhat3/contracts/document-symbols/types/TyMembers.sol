// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

enum TyKind {
    Small,
    Big
}

type TyId is bytes32;

interface ITyToken {
    function total() external view returns (uint256);
}

contract TyOwner {}

struct TyInner {
    uint8 flag;
}

struct TyScalars {
    bool ok;
    uint256 amount;
    int8 delta;
    address payable wallet;
    bytes4 selector;
    bytes blob;
    string label;
}

struct TyComposites {
    uint256[] list;
    uint256[3] triple;
    TyInner inner;
    TyInner[] inners;
    TyKind kind;
    TyId id;
    ITyToken token;
    TyOwner owner;
}

struct TyMappings {
    mapping(address => uint256) balances;
    mapping(address => mapping(uint256 => TyInner)) nested;
    mapping(address user => TyInner[] entries) byUser;
}

struct TyCallbacks {
    function(uint256) external returns (uint256) onValue;
    function() internal pure returns (bool) check;
}

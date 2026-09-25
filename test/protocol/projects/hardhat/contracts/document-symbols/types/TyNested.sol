// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract TyTree {
    struct TyLeaf {
        uint256 weight;
    }

    struct TyBranch {
        TyLeaf leaf;
        TyLeaf[] leaves;
        mapping(uint256 => TyLeaf) byId;
    }

    struct TyNode {
        uint256 value;
        TyNode[] kids;
    }

    TyBranch internal root;
}

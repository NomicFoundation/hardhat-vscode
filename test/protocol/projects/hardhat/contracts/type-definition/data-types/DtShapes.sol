// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract DtRegistry {
    struct Entry {
        uint256 id;
    }
}

contract DtShapes {
    enum Color {
        Red,
        Green
    }

    struct Inner {
        Color color;
        uint256 weight;
    }

    struct Outer {
        uint256 a;
        Inner inner;
    }

    Outer[] public outers;
    Outer[][2] internal grid;
    mapping(address => mapping(uint256 => Outer)) internal nested;
    mapping(Color => Inner) internal byColor;

    function readParam(Outer memory param) external pure returns (uint256) {
        return param.a;
    }

    function readLocal() external view returns (uint256) {
        Outer memory local = outers[0];
        return local.a + local.inner.weight;
    }

    function readChain() external view returns (Color) {
        return outers[0].inner.color;
    }

    function readStorage(uint256 i) external view returns (uint256) {
        return grid[1][i].a + nested[msg.sender][i].a + byColor[Color.Red].weight;
    }

    function readQualified() external pure returns (uint256) {
        DtRegistry.Entry memory entry = DtRegistry.Entry(1);
        return entry.id;
    }
}

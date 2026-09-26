// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {Registry} from "./Registry.sol";

contract DataTypes {
    enum Color {
        Red,
        Green
    }

    struct Inner {
        uint256 b;
    }

    struct Outer {
        uint256 a;
        Inner inner;
    }

    Outer[] public outers;
    mapping(address => mapping(uint256 => Outer)) public nested;
    mapping(address user => uint256 balance) public balances;

    function chained(Outer memory s) external pure returns (uint256) {
        return s.a + s.inner.b;
    }

    function fromNested(uint256 k) external view returns (uint256) {
        return nested[msg.sender][k].a;
    }

    function append() external {
        outers.push().a = 1;
    }

    function constructors() external pure returns (uint256) {
        Outer memory p = Outer(1, Inner(2));
        Outer memory n = Outer({a: 3, inner: p.inner});
        return p.a + n.a;
    }

    function returned() external pure returns (uint256) {
        return build().a;
    }

    function build() internal pure returns (Outer memory) {
        return Outer(4, Inner(5));
    }

    function colors() external pure returns (Color, Color, Color) {
        return (Color.Red, type(Color).min, type(Color).max);
    }

    function entry() external pure returns (Registry.Kind) {
        Registry.Entry memory e = Registry.Entry(Registry.Kind.Big, 6);
        return e.kind;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IhIToken, IhMath, IhBase} from "./IhBase.sol";

contract IhChild {
    uint256 public n;

    constructor(uint256 start) {
        n = start;
    }
}

contract IhDerived is IhBase {
    IhChild public child;

    constructor(address a) {
        token = IhIToken(a);
        child = new IhChild(1);
    }

    function self() public view override returns (IhBase) {
        return super.self();
    }

    function make() external returns (IhChild made) {
        made = new IhChild(2);
        IhIToken p = token.peer();
        IhDerived me = this;
        string memory label = type(IhChild).name;
        uint256 v = IhMath.twice(child.n());
    }
}

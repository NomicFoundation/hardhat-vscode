// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

abstract contract Parent {
    function foo() public virtual;
}

contract Inheritor is Parent {
    function foo() public override {}
}

contract GrandInheritor is Inheritor {
    function foo() public override {}
}

contract NonInheritor {
    Parent stored;

    function setParent(Parent p) public {
        stored = p;
    }

    function foo() public {}
}

library ParentLib {
    function bar(Parent p) internal {}
}

contract UsingForUser {
    using ParentLib for Parent;

    function foo() public {}
}

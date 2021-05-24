// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.3;

interface ABV {
    function foo() external;
    function bar() external;
}

contract A is ABV {
    // This is called an event. You can emit events from your function
    // and they are logged into the transaction log.
    // In our case, this will be useful for tracing function calls.
    event Log(string message);

    struct Voter {
        uint a;
    }

    function foo() public virtual override {
        emit Log("A.foo called");
    }

    function bar() public virtual override {
        emit Log("A.bar called");
    }

    function testFunc1() public {
    }
}

contract B is A {
    ABV asddsa;

    function foo() public virtual override {
        emit Log("B.foo called");
        A.foo();
    }

    function bar() public virtual override {
        emit Log("B.bar called");
        super.bar();
    }
}

contract C is A {
    function foo() public virtual override {
        emit Log("C.foo called");
        A.foo();
    }

    function bar() public virtual override {
        emit Log("C.bar called");
        super.bar();
    }

    function testFunc2() public {
    }
}

contract D is B, C {
    function foo() public override(B, C) {
        bar();
        super.foo();
    }

    function bar() public override(B, C) {
        super.bar();
    }

    function testFunc() public {
        testFunc1();
        testFunc2();
    }
}

// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.3;

interface ABV {
    function foo() external;
    function bar() external;
}

// file-level constant
uint constant topLevelConstantVariable = 3;

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
    uint a = topLevelConstantVariable;

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
    uint256 private constant ONE = 1;
    uint256 private immutable TWO = 2;

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
    using SafeMath for uint256;

    function foo() public override(B, C) {
        bar();
        super.foo();
    }

    function bar() public override(B, C) {
        super.bar();
    }

    function testFunc(
        address[] calldata path
    ) external returns (uint256[] memory amounts) {
        amounts = new uint256[](path.length + 1);

        testFunc1();
        testFunc2();
    }

    function getOtherToken(
        address token0,
        address token1,
        address tokenA
    ) public pure returns (address tokenB) {
        tokenB = token0 == tokenA ? token1 : token0;
    }
}

library SafeMath {
    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x + y) >= x, "ds-math-add-overflow");
    }

    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x - y) <= x, "ds-math-sub-underflow");
    }

    function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x, "ds-math-mul-overflow");
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256 c) {
        require(b > 0, "ds-math-division-by-zero");
        c = a / b;
    }
}

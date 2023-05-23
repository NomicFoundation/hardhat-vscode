// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.8;

type CustomType is uint256;

interface TestInterface {
    function interfaceFunction(uint256 param) external returns (string memory);
}

struct TestStruct {
    uint256 aNumber;
    string aString;
    address anAddress;
}

struct TestStruct2 {
    uint256 aNumber;
    string aString;
    address anAddress;
}

uint256 constant aConstant = 1234;

enum Name {
    A,
    B
}

error CustomError();

library TestLibrary {}

contract testContract {
    constructor() {
        uint256 local = aConstant;
        local;
    }

    modifier testModifier() {
        _;
    }

    event TestEvent(
        testContract contractAsEventParam, TestInterface interfaceAsEventParam, TestStruct structAsEventParam
    );

    testContract contractAsMember;

    TestInterface interfaceAsMember;

    TestStruct structAsMember;

    uint256 aNumber = 0x12 + 123;

    string aString = "asdf";

    function testFunction(
        testContract contractAsFuncParam,
        TestInterface interfaceAsFuncParam,
        TestStruct memory structAsFuncParam
    ) public {
        testContract contractAsLocalVar;

        TestInterface interfaceAsLocalVar;
        TestStruct memory structAsLocalVar;
        contractAsLocalVar;
        contractAsFuncParam;
        interfaceAsFuncParam;
        interfaceAsLocalVar;
        structAsFuncParam;
        structAsLocalVar;

        emit TestEvent(contractAsLocalVar, interfaceAsLocalVar, structAsLocalVar);

        //ñññññ

        TestStruct memory afterUTF8;
        afterUTF8;
        anotherFunction();
    }

    function anotherFunction() public pure {}

    fallback() external {}

    receive() external payable {}
}

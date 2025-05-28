// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.8;

type CustomType is uint256;

interface TestInterface {}

struct TestStruct {
    uint256 aNumber;
    string aString;
    address anAddress;
}

enum TestEnum {
    A,
    B,
    C
}

error CustomError();

library MyLibrary {}

contract testContract {
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

        // The following expression statements should not be highlighted
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
}

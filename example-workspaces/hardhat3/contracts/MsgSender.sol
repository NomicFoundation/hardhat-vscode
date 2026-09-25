//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.30;
import "hardhat/console.sol";

contract MsgSenderExample {
    function senderTest() public {
        // balance
        uint256 a = msg.sender.balance;
        console.log(a);

        // code
        bytes memory code = msg.sender.code;
        console.log(code.length);

        // codehash
        bytes32 codehash = msg.sender.codehash;
        console.log(codehash.length);

        // call
        bool callResult;
        bytes memory callData;
        (callResult, callData) = msg.sender.call("");
        console.log(callResult);
        console.log(callData.length);

        // delegatecall
        bool callResult2;
        bytes memory callData2;
        (callResult, callData) = msg.sender.delegatecall("");
        console.log(callResult2);
        console.log(callData2.length);

        // staticcall
        bool callResult3;
        bytes memory callData3;
        (callResult, callData) = msg.sender.staticcall("");
        console.log(callResult3);
        console.log(callData3.length);
    }
}

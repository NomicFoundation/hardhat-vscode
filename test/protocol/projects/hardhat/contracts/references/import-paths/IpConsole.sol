// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "hardhat/console.sol";

contract IpConsole {
    function show(bytes7 tag) public view {
        console.logBytes7(tag);
        console.log(msg.sender, true);
        console.log(true, msg.sender);
        console.log(msg.sender);
        console.log(address(this), false);
        console.log("logBytes7");
    }
}

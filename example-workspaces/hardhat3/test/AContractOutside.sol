// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Checker {
    event Complete4(bool status);

    function validate(uint32 n) public {
        if (n == 1) {
            emit Complete4(true);
        } else if (n == 5) {
            emit Complete4(true);
        } else {
            emit Complete4(false);
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Checker {
    event Complete(bool status);

    function validate(uint32 n) public {
        if (n == 1) {
            emit Complete(true);
        } else if (n == 5) {
            emit Complete(true);
        } else {
            emit Complete(false);
        }
    }
}

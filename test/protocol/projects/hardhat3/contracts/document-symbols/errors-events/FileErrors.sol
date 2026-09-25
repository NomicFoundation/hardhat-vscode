// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

error EEFileError();
error EEFileErrorWithArgs(uint256 code, string reason);

contract EEFileErrorUser {
    function check(uint256 code) external pure {
        if (code == 0) revert EEFileError();
        revert EEFileErrorWithArgs(code, "bad");
    }
}

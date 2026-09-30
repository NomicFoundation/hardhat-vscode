// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract EERGGuard {
    error Blocked(uint256 code, address who);

    string internal reason;

    function check(uint256 code) external {
        reason = "checked";
        if (code == 0) revert Blocked({code: code, who: msg.sender});
    }
}

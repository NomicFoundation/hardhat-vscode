// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract EERLog {
    event Logged(uint256 value);
    event Logged(address who);
    error Denied(address who);

    function ping() external {
        emit Logged(uint256(1));
    }
}

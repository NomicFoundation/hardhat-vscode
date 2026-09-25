// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {EERLog} from "./Log.sol";

contract EERUser is EERLog {
    // Moved is emitted by move, and Denied guards it.
    event Moved(uint256 amount);

    function move(uint256 x) external {
        if (msg.sender == address(0)) revert Denied(msg.sender);
        emit Logged(x);
        emit Logged(msg.sender);
        emit Moved(x);
    }

    function selectors() external pure returns (bytes32, bytes4, string memory) {
        return (Moved.selector, Denied.selector, "Moved Denied Logged");
    }
}

contract EEROther {
    event Moved(uint256 amount);
    error Denied(address who);

    function other() external {
        emit Moved(2);
        emit EERLog.Logged(3);
        revert Denied(address(this));
    }
}

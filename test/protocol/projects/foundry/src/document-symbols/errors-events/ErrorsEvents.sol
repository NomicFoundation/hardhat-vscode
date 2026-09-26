// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract EEErrors {
    error Empty();
    error Failed(uint256 code, string reason);
}

contract EEEvents {
    event Ping();
    event Transfer(address indexed from, address indexed to, uint256 value);
}

contract EEAnonymous {
    event Raw(bytes32 indexed topic, uint256 value) anonymous;
    event RawEmpty() anonymous;
}

contract EEOverloads {
    event Log(string message);
    event Log(uint256 a, uint256 b);
    event Log(address indexed who) anonymous;
}

contract EEUnnamed {
    error Coded(uint256, address);
    event Signal(uint256, bytes32 indexed);
}

interface IEESource {
    error SourceFailed(address source);
    event SourceUpdated(address indexed source, uint256 value);

    function read() external view returns (uint256);
}

library EELib {
    error LibOverflow(uint256 value);
    event LibUsed(address caller);

    function check(uint256 value) internal pure returns (uint256) {
        if (value > 100) revert LibOverflow(value);
        return value;
    }
}

contract EEDerived is IEESource {
    event Refreshed();

    function read() external pure returns (uint256) {
        return 1;
    }
}

contract EEUser {
    error Rejected(address caller, uint256 amount);

    event Moved(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    uint256 private total;

    function fire(uint256 amount) external {
        uint256 doubled = amount * 2;
        if (doubled == 0) revert Rejected(msg.sender, amount);
        total += doubled;
        emit Moved(msg.sender, address(this), doubled);
    }
}

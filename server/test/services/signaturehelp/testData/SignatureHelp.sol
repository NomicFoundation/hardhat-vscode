// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract SignatureHelpTest {
    event Transfer(address indexed from, address indexed to, uint256 amount);
    error InsufficientFunds(uint256 available, uint256 required);

    function noParams() public pure returns (uint256) {
        return 42;
    }

    function oneParam(uint256 x) public pure returns (uint256) {
        return x;
    }

    function twoParams(uint256 x, uint256 y) public pure returns (uint256) {
        return x + y;
    }

    /// @notice Calls twoParams
    /// @param a First value
    /// @param b Second value
    function callTwoParams(uint256 a, uint256 b) public pure returns (uint256) {
        return twoParams(a, b);
    }

    function callOneParam(uint256 val) public pure returns (uint256) {
        return oneParam(val);
    }

    function callNoParams() public pure returns (uint256) {
        return noParams();
    }

    function emitEvent() public {
        emit Transfer(msg.sender, address(0), 100);
    }
}

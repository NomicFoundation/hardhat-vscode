// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
import {Token} from "@token/Token.sol";

contract ManagedHook {
    Token public token;
    function amount() public pure returns (uint256) {
        return 1;
    }
}

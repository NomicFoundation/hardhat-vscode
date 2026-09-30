// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IpBase} from "../IpBase.sol";

// IpBase in a comment is not a use
contract IpNested is IpBase {
    string private constant NAME = "IpBase";

    function ipNestedPing() public pure returns (uint256) {
        return ipPing() + 1;
    }
}

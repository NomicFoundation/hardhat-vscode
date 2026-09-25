// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {Vault, IfUserB} from "./IfUserB.sol";

contract IfUserC is IfUserB {
    Vault public third;
}

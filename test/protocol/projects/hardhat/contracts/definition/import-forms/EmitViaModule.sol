// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import * as M from "./Lib.sol";

contract EmitViaModule {
    function fire() external {
        emit M.Ev(1);
    }
}

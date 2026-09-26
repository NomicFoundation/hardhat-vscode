// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/access/Ownable.sol";

contract RnIpOwnable is Ownable {
    bool public rnIpRenounced;

    function renounceOwnership() public override onlyOwner {
        rnIpRenounced = true;
    }

    function rnIpGiveUp() public {
        renounceOwnership();
    }
}

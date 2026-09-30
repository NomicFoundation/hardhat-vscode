// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TransientDefs {
    uint256 private constant LOCK_SLOT = 0x1234;

    function guarded(uint256 value) external returns (uint256 seen) {
        assembly {
            tstore(LOCK_SLOT, value)
            seen := tload(LOCK_SLOT)
        }
    }
}

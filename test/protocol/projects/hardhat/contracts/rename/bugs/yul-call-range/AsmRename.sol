// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract AsmRename {
    function nested(uint256 seed) external pure returns (uint256 out) {
        assembly {
            function bump(v) -> w {
                w := add(v, 1)
            }
            out := bump(bump(seed))
            out := bump(
                out
            )
        }
    }
}

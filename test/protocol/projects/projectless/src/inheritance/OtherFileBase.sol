// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

abstract contract OtherFileBase {
    function work() internal pure returns (uint256) {
        uint256 vm = 1;

        // This body's character offsets span those of `vm` in
        // OtherFileScope.sol, so an offset-only scope check would resolve that
        // usage to the local `vm` above.
        vm += 1;
        vm += 1;
        vm += 1;
        vm += 1;
        vm += 1;

        return vm;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

interface PsVmSafe {
    function addr(uint256 privateKey) external pure returns (address);
}

interface PsVm is PsVmSafe {
    function prank(address msgSender) external;
}

abstract contract PsCommonBase {
    PsVm internal constant vm = PsVm(address(0));
}

abstract contract PsStdUtils {
    PsVmSafe private constant vm = PsVmSafe(address(0));
}

contract PsTest is PsCommonBase, PsStdUtils {
    function run() external {
        vm.prank(address(1));
    }
}

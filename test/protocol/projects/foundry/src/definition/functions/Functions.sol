// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {FnMathLib, FnVault} from "./FunctionsLib.sol";

contract FnExamples {
    FnVault internal vault;

    function add(uint256 a, uint256 b) public pure returns (uint256 sum) {
        sum = a + b;
    }

    function add(uint256 a) public pure returns (uint256) {
        return a + 1;
    }

    function triple(uint256 x) internal pure returns (uint256) {
        return x * 3;
    }

    function ping() external pure returns (uint256) {
        return 7;
    }

    function applyFn(function(uint256) internal pure returns (uint256) fn, uint256 x) internal pure returns (uint256) {
        return fn(x);
    }

    function overloads() external pure returns (uint256) {
        uint256 one = add(1);
        uint256 two = add(2, 3);
        uint256 named = add({b: 2, a: 1});
        return one + two + named;
    }

    function pointers() external pure returns (uint256) {
        function(uint256) internal pure returns (uint256) op = triple;
        return op(3) + applyFn(triple, 4);
    }

    function libraryCall() external pure returns (uint256) {
        return FnMathLib.twice(4);
    }

    function externalCalls() external payable returns (bool ok) {
        uint256 current = vault.total();
        vault.deposit{value: msg.value}(current, msg.sender);
        function(uint256, address) external payable returns (bool) ext = vault.deposit;
        ext(1, msg.sender);
        ok = vault.deposit({to: msg.sender, amount: 1});
    }

    function viaThis() external view returns (uint256) {
        return this.add(4, 5) + this.ping();
    }

    function selectors() external view returns (bytes4, bytes4, bytes4, bytes memory) {
        return (
            this.ping.selector,
            FnVault.deposit.selector,
            vault.total.selector,
            abi.encodeWithSelector(FnVault.deposit.selector, 1, address(0))
        );
    }
}

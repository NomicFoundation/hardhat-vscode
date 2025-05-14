// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

abstract contract AbstractVault {

    constructor () {
        // ...
    }

    modifier fee(uint _fee) {
        _;
    }
}

contract Vault is AbstractVault {

    constructor () AbstractVault() {
        // ...
    }

    modifier fee1(uint _fee) {
        _;
    }

    function withdraw(uint _amount) external payable fee(0.025 ether) fee1(0.025 ether) fee2(0.025 ether) {
        // ...
    }

    modifier fee2(uint _fee) {
        _;
    }
}

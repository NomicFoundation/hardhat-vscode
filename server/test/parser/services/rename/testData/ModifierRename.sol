// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Base {
    uint128 internal _balance;

    constructor(uint128 balance) {
        _balance = balance;
    }

    modifier exampleMod() {
        _;
    }

    function getBalance() public view virtual exampleMod returns (uint128) {
        return _balance;
    }
}

contract Extension is Base {
    constructor() Base(10) exampleMod anotherMod {}

    modifier anotherMod() {
        _;
    }

    function getBalance()
        public
        view
        override
        exampleMod
        anotherMod
        returns (uint128)
    {
        return _balance;
    }
}

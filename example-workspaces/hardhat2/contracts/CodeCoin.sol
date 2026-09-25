// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract CodeCoin is IERC20 {
    function totalSupply() external view override returns (uint256) {}

    function balanceOf(address account)
        external
        view
        override
        returns (uint256)
    {}

    function transfer(address to, uint256 amount)
        external
        override
        returns (bool)
    {}

    function allowance(address owner, address spender)
        external
        view
        override
        returns (uint256)
    {}

    function approve(address spender, uint256 amount)
        external
        override
        returns (bool)
    {}

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external override returns (bool) {}
}

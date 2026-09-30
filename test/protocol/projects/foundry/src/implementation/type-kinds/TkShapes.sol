// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./TkTypes.sol";

contract TkShapes {
    struct Inner {
        uint256 v;
    }

    event Moved(address indexed who, uint256 x);

    TkPoint public position;
    mapping(address => TkPoint[]) public trails;
    TkColor public color = TkColor.Red;
    TkPrice public price;
    TkVault public vault;
    Inner internal inner;

    function move(TkPoint memory to) external returns (TkPoint memory previous) {
        previous = position;
        TkPoint memory next = TkPoint({x: to.x, y: to.y});
        position = next;
        trails[msg.sender].push(next);
        emit Moved(msg.sender, next.x);
    }

    function paint(TkColor c) external returns (TkColor old) {
        old = color;
        if (c == TkColor.Green) revert TkTooLow(uint256(type(TkColor).max));
        color = c;
    }

    function setPrice(uint256 raw) external {
        TkPrice p = TkPrice.wrap(raw);
        price = tkDouble(p);
    }

    function attach(TkVault v) external {
        vault = v;
        TkVault fresh = new TkVault();
        fresh.deposit(1);
    }

    function bump() external returns (Inner memory copy) {
        inner.v += 1;
        copy = inner;
    }
}

// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "hardhat/console.sol";

contract AuctionBase {
    event BaseEvent(uint first);
}

contract Auction is AuctionBase {
    type UserType is uint256;

    enum Status {
        Pending,
        Shipped,
        Accepted,
        Rejected,
        Canceled
    }

    struct TodoStruct {
        string text;
        bool completed;
        Status status;
    }

    event SimpleEvent();
    event ArgEvent(
        uint first,
        TodoStruct second,
        AuctionBase third,
        Status fourth
    );

    function events() public {
        TodoStruct memory localStruct;
        AuctionBase b = new AuctionBase();

        emit SimpleEvent();
        emit ArgEvent(1, localStruct, b, Status.Canceled);
        emit BaseEvent(1);
    }
}

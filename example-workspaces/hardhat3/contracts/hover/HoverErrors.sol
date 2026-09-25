// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "hardhat/console.sol";

contract AuctionBase {
    error BaseError(uint first);
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

    error SimpleError();
    error ArgError(
        uint first,
        TodoStruct second,
        AuctionBase third,
        Status fourth
    );

    function errors() public {
        TodoStruct memory localStruct;

        AuctionBase b = new AuctionBase();

        if (1 < 2) {
            revert SimpleError();
        }

        if (1 < 2) {
            revert ArgError(1, localStruct, b, Status.Canceled);
        }

        if (1 < 2) {
            revert BaseError(1);
        }
    }
}

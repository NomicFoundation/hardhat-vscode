// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

interface IFnToken {
    function balanceOf(address who) external view returns (uint256);
}

library FnGeo {
    struct Point {
        uint256 x;
        uint256 y;
    }

    function scale(Point memory p, uint256 k) internal pure returns (Point memory) {
        return Point(p.x * k, p.y * k);
    }
}

contract FnVault {
    enum Status {
        Open,
        Closed
    }

    struct Receipt {
        uint256 amount;
        Status status;
    }

    IFnToken public token;
    mapping(address => Status) public statuses;

    function deposit(IFnToken asset, uint256 amount) external returns (Receipt memory receipt) {
        statuses[msg.sender] = Status.Open;
        receipt = Receipt(amount + asset.balanceOf(msg.sender), Status.Open);
    }
}

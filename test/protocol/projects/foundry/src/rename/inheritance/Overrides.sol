// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

interface InISupply {
    function total() external view returns (uint256);

    function peek(uint256 key) external view returns (uint256);
}

contract InLeft {
    modifier guarded() virtual {
        _;
    }

    function tag() public pure virtual returns (uint256) {
        return 1;
    }

    function tag(bytes32 salt) public pure returns (uint256) {
        return uint256(salt);
    }
}

contract InRight {
    function tag() public pure virtual returns (uint256) {
        return 2;
    }
}

contract InJoined is InLeft, InRight {
    modifier guarded() override {
        _;
    }

    function tag() public pure override(InLeft, InRight) returns (uint256) {
        return InLeft.tag() + InRight.tag() + tag(bytes32(0));
    }

    function run() external pure guarded returns (uint256) {
        return tag();
    }
}

contract InStore is InISupply {
    uint256 public override total;
    uint256 internal limit;

    function setLimit(uint256 next) external {
        limit = next;
    }

    function peek(uint256 key) external view returns (uint256) {
        return key + total;
    }
}

contract InShadow is InStore {
    function scaled(uint256 factor) external view returns (uint256) {
        uint256 limit = factor * 2;
        return limit + this.total() + this.peek(1);
    }

    function cap() external view returns (uint256) {
        return limit;
    }
}

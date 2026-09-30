// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

error NsTooSmall(uint256 value, uint256 minimum);

interface NsRequireErrors {
    error NsNotOwner(address caller);
}

contract NsRequire {
    error NsEmpty();

    address public owner;
    uint256 public minimum = 10;

    function check(uint256 value) external view {
        uint256 floor = minimum;
        require(value > 0, NsEmpty());
        require(value >= floor, NsTooSmall(value, floor));
        require(msg.sender == owner, NsRequireErrors.NsNotOwner(msg.sender));
    }
}

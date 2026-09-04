// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

event FileEvent(address indexed sender, uint256 amount);

error InsufficientBalance(uint256 available, uint256 required);

contract Base {
    function baseFunc() public pure returns (uint256) {
        return 1;
    }
}

contract HoverTest is Base {
    uint256 public count;
    string private name;
    address public owner;

    event Transfer(address indexed from, address indexed to, uint256 value);
    error Unauthorized(address caller);

    struct User {
        string name;
        uint256 balance;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(uint256 _count) {
        count = _count;
        owner = msg.sender;
    }

    function setCount(uint256 _count) public onlyOwner {
        count = _count;
    }

    function getCount() public view returns (uint256) {
        return count;
    }

    function createUser(string memory _name, uint256 _balance) public pure returns (User memory) {
        User memory user = User(_name, _balance);
        return user;
    }

    function localVarExample() public view returns (uint256) {
        uint256 localVal = count + 1;
        return localVal;
    }

    function emitExample() public {
        emit Transfer(msg.sender, address(0), 100);
    }

    function revertExample(uint256 amount) public view {
        if (amount > count) {
            revert Unauthorized(msg.sender);
        }
    }

    function callBase() public pure returns (uint256) {
        return baseFunc();
    }
}

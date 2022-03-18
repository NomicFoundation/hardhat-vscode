// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "hardhat/console.sol";

contract BaseHoverFunctions {
    bool internal stateBool = true;

    constructor(bool paramBool) {
        stateBool = paramBool;
    }

    function fromBase()
        public
        view
        virtual
        returns (uint112 first, uint112 second)
    {
        return (1, 2);
    }
}

contract HoverFunctions is BaseHoverFunctions {
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

    string internal stateString = "Hello";

    constructor(string memory paramName) BaseHoverFunctions(false) {
        stateString = paramName;
        stateBool = false;
    }

    function minimal() public {}

    function withReturn() public view returns (string memory output) {
        return stateString;
    }

    function withBasicParams(
        string calldata paramString,
        bool paramBool,
        uint112 paramInt,
        address paramAddr,
        UserType paramUserType,
        Status paramEnum,
        TodoStruct memory paramStruct
    ) public view {
        console.log(paramString);
        console.log(paramBool);
        console.log(paramInt);
        console.log(paramAddr);
        console.log(UserType.unwrap(paramUserType));
        console.log(paramEnum == Status.Pending);
        console.log(paramStruct.text);
    }

    function withArrayParams(
        uint256[] memory paramIntArray,
        Status[] calldata paramEnumArray,
        UserType[] memory paramUserTypeArray,
        TodoStruct[] calldata paramStructArray
    ) public view returns (string memory output) {
        console.log(paramIntArray.length);
        console.log(paramEnumArray.length);
        console.log(paramUserTypeArray.length);
        console.log(paramStructArray.length);

        return stateString;
    }

    function fromBase()
        public
        view
        virtual
        override
        onlyExample
        validAddress(msg.sender, 34)
        returns (uint112 first, uint112 second)
    {
        return (1, 2);
    }

    modifier onlyExample() {
        _;
    }

    modifier validAddress(address _addr, uint256 balance) {
        require(_addr != address(0), "Not valid address");
        require(balance > 0, "Not an allowed balance");
        _;
    }

    function main() private {
        TodoStruct memory localStruct;
        uint[] memory localArray = new uint[](5);
        Status[] memory localEnumArray = new Status[](5);
        UserType[] memory localUserTypeArray = new UserType[](5);
        TodoStruct[] memory localStructArray = new TodoStruct[](5);

        this.minimal();
        this.withReturn();

        this.withBasicParams(
            "hello",
            false,
            1,
            msg.sender,
            UserType.wrap(12),
            Status.Canceled,
            localStruct
        );

        this.withArrayParams(
            localArray,
            localEnumArray,
            localUserTypeArray,
            localStructArray
        );

        this.fromBase();
    }
}

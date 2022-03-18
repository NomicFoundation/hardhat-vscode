// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "hardhat/console.sol";

contract Auction {
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
    bool private stateBool = true;
    uint public stateInt = 123;
    address payable public stateAddr;
    UserType public stateUserType;
    Status internal stateEnum = Status.Rejected;
    TodoStruct stateStruct;

    uint256[] public stateIntArray;
    Status[] public stateEnumArray;
    UserType[] public stateUserTypeArray;
    TodoStruct[] public stateStructArray;

    mapping(address => uint) stateSimpleMapping;
    mapping(UserType => UserType) stateUserTypeMapping;
    mapping(address => string[]) stateNestedArrayMapping;
    mapping(address => mapping(address => uint)) stateNestedMapMapping;

    event SimpleEvent();
    event ArgEvent(address first, uint second);

    error SimpleError();
    error ArgError(uint first, TodoStruct second, Auction third, Status fourth);

    function getText() external view virtual returns (string memory output) {
        return "output";
    }

    function locals() external view virtual returns (uint256) {
        string memory localString = this.getText();
        bool localBool = true;
        uint256 localInt = 456;
        address localAddr = msg.sender;
        UserType localUserType = UserType.wrap(uint256(456));
        Status localEnum = Status.Pending;
        TodoStruct memory localStruct;

        uint[] memory localIntArray = new uint[](5);
        Status[] memory localEnumArray = new Status[](5);
        UserType[] memory localUserTypeArray = new UserType[](5);
        TodoStruct[] memory localStructArray = new TodoStruct[](5);

        // mapping(address => uint) memory localMapping;

        // Local Accesses

        console.log(localString);
        console.log(localBool);
        console.log(localInt);
        console.log(localAddr);
        console.log(UserType.unwrap(localUserType));
        console.log(localEnum == Status.Pending);
        console.log(localStruct.text);

        console.log(localIntArray.length);
        console.log(localEnumArray.length);
        console.log(localUserTypeArray.length);
        console.log(localStructArray.length);

        // console.log(localMapping);

        return 0;
    }

    function parameters(
        string calldata paramString,
        bool paramBool,
        uint112 paramInt,
        address paramAddr,
        UserType paramUserType,
        Status paramEnum,
        TodoStruct memory paramStruct,
        uint144[] storage paramIntArray,
        Status[] memory paramEnumArray,
        UserType[] calldata paramUserTypeArray,
        TodoStruct[] storage paramStructArray,
        mapping(address => uint) storage paramSimpleMapping,
        mapping(UserType => UserType) storage paramUserTypeMapping,
        mapping(address => string[]) storage paramNestedArrayMapping,
        mapping(address => mapping(address => uint))
            storage paramNestedMapMapping
    ) internal view virtual returns (uint256) {
        // Param Accesses

        console.log(paramString);
        console.log(paramBool);
        console.log(paramInt);
        console.log(paramAddr);
        console.log(UserType.unwrap(paramUserType));
        console.log(paramEnum == Status.Pending);
        console.log(paramStruct.text);

        console.log(paramIntArray.length);
        console.log(paramEnumArray.length);
        console.log(paramUserTypeArray.length);
        console.log(paramStructArray.length);

        console.log(paramSimpleMapping[msg.sender]);
        console.log(UserType.unwrap(paramUserTypeMapping[UserType.wrap(123)]));
        console.log(paramNestedArrayMapping[msg.sender].length);
        console.log(paramNestedMapMapping[msg.sender][msg.sender]);

        return 0;
    }

    function stateVariables() external view virtual returns (uint256) {
        // State variable accesses
        console.log(stateString);
        console.log(stateBool);
        console.log(stateInt);
        console.log(stateAddr);
        console.log(UserType.unwrap(stateUserType));
        console.log(stateEnum == Status.Pending);
        console.log(stateStruct.text);

        console.log(stateIntArray.length);
        console.log(stateEnumArray.length);
        console.log(stateUserTypeArray.length);
        console.log(stateStructArray.length);

        console.log(stateSimpleMapping[msg.sender]);
        console.log(UserType.unwrap(stateUserTypeMapping[UserType.wrap(123)]));
        console.log(stateNestedArrayMapping[msg.sender].length);
        console.log(stateNestedMapMapping[msg.sender][msg.sender]);

        return 0;
    }
}

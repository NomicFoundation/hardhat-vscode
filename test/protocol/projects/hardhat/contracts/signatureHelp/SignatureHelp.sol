// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

event Approval(address indexed owner, address indexed spender, uint256 value);

contract SignatureHelpTest {
    uint256 public value;

    event Transfer(address indexed from, address indexed to, uint256 amount);

    constructor(uint256 _value) {
        value = _value;
    }

    function noParams() public pure returns (uint256) {
        return 42;
    }

    function oneParam(uint256 x) public pure returns (uint256) {
        return x;
    }

    function twoParams(uint256 x, uint256 y) public pure returns (uint256) {
        return x + y;
    }

    function callExample() public pure returns (uint256) {
        uint256 result = twoParams(1, 2);
        uint256 single = oneParam(3);
        uint256 none = noParams();
        return result + single + none;
    }

    function emitExample() public {
        emit Transfer(msg.sender, address(0), 100);
    }

    function constructorCallExample() public returns (SignatureHelpTest) {
        return new SignatureHelpTest(42);
    }
}

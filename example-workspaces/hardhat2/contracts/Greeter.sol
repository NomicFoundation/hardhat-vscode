//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.30;
import "hardhat/console.sol";
import "./access/Auth.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Greeter is Ownable {
    string private greeting;
    Auth private _auth;

    constructor(string memory _greeting) {
        console.log("Deploying a Greeter");
        greeting = _greeting;
        _auth = new Auth(msg.sender);
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
        require(_auth.isAdministrator(msg.sender), "Unauthorized");
        console.log("Changing greeting from '%s' to '%s'", greeting, _greeting);

        greeting = _greeting;
    }
}

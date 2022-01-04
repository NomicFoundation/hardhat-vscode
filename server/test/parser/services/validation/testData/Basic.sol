// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Test {
    uint120 public balance;
    address public owner;

	constructor() {
		balance = 10;
    owner = msg.sender;
	}

  /**
    * Reset the contract balance.
    */
  function resetBalance(uint120 value, address newOwner) public {
      balance = value;
      owner = newOwner;
  }

  function pointless() public {
      resetBalance(12, 34, msg.sender);
  }
}

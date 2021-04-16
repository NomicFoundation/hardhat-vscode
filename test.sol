pragma solidity ^0.4.18;

contract BasicToken {
  struct Answer {
      bytes32 text; 
      uint voteCount;
  }

  struct Question {
      Answer text;
  }

  mapping(address => uint256) balances;

  uint256 test;

  function transfer(address recipient, uint256 value) public {
    balances[msg.sender] -= value;
    balances[recipient] += value;
  }

  function balanceOf(address account) public constant returns (uint256) {
    return balances[account];
  }

}

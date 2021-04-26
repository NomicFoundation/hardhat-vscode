pragma solidity ^0.4.18;

contract BasicToken {
  struct Answer {
    bytes32 text;
    uint voteCount;
  }

  struct Question {
    Answer test;
  }

  mapping(address => Answer) public answers;

  mapping(address => uint256) balances;

  function transfer(address recipient, uint256 value) public {
    balances[msg.sender] -= value;
    balances[recipient] += value;
  }

  function balanceOf(address account, Question ans) public constant returns (uint256) {
    ans.test.text = 1;

    answers[account].voteCount = 1;

    return balances[account];
  }
}

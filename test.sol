pragma solidity ^0.4.18;

contract BasicToken {
  struct Answer {
    bytes32 text;
    uint voteCount;
  }

  Answer a = Answer({
    text: 1,
    voteCount: 0
  });
}

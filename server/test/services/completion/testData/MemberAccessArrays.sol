// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ArrayCompletionBase {
  int256[] public baseArr;
}

contract ArrayCompletion is ArrayCompletionBase {
  struct Example {
    int256[] nested;
  }

  int256[] private stateArr;
  Example private nestedExample;

  function afunction(int256 num, int256[] memory paramArr)
    public
    returns (uint256)
  {
    uint256[1] memory local = [uint256(1)];

    uint256 l = local.length;
    stateArr.push(num);
    nestedExample.nested.pop();
    baseArr.pop();
    return paramArr.length + l;
  }
}

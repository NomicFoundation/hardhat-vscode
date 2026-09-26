// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

struct NsAccount {
    uint256 id;
    mapping(address spender => uint256 amount) allowance;
}

contract NsNamedMapping {
    mapping(address owner => uint256 balance) public balanceOf;
    mapping(address owner => mapping(address spender => uint256 amount)) internal allowances;
    mapping(uint256 id => NsAccount account) internal accounts;

    function approve(address spender, uint256 amount) external {
        mapping(address spender => uint256 amount) storage mine = allowances[msg.sender];
        mine[spender] = amount;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

uint256 constant BASE_SLOT = 0x1000;
uint256 constant SHIFTED_SLOT = BASE_SLOT + 2;
string constant NAMESPACE = "example.storage.layout";
uint256 constant NAMESPACE_SLOT = erc7201(NAMESPACE);

contract AtConstant layout at SHIFTED_SLOT {
    uint256 public a;
}

contract AtErc7201 layout at erc7201(NAMESPACE) {
    uint256 public b;
}

contract AtErc7201Constant layout at NAMESPACE_SLOT + BASE_SLOT {
    uint256 public c;
}

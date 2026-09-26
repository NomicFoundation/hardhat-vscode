// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/access/Ownable.sol";

contract IpOwnable is Ownable {
    function handOver(address next) public onlyOwner {
        _transferOwnership(next);
    }

    function reset() public onlyOwner {
        // _transferOwnership in a comment is not a use
        _transferOwnership(address(0));
    }

    function data() public view returns (bytes memory) {
        return _msgData();
    }
}

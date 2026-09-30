// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {Base, IExtended} from "./Base.sol";

contract Middle is Base {
    constructor() Base(1) {}

    function value() public view virtual override returns (uint256) {
        return super.value() + 1;
    }

    function bump() public virtual override {
        stored += 1;
    }
}

contract Leaf is Middle {
    function value() public view override returns (uint256) {
        return Base.value() + super.value();
    }

    function bump() public override(Middle) {
        stored += 2;
    }
}

contract Fixed is Base(7) {
    function bump() public override {
        stored = value() + 7;
    }
}

contract Factory {
    function deploy(bytes32 salt) external returns (address, address) {
        Middle plain = new Middle();
        Leaf salted = new Leaf{salt: salt}();
        return (address(plain), address(salted));
    }

    function describe() external pure returns (string memory, bytes4) {
        return (type(Leaf).name, type(IExtended).interfaceId);
    }

    function read(address target) external view returns (uint256) {
        return IExtended(target).value();
    }
}

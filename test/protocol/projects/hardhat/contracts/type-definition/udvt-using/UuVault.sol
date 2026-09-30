// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {UuPrice} from "./UuPrice.sol";

library UuConv {
    function toPrice(uint256 x) internal pure returns (UuPrice) {
        return UuPrice.wrap(x);
    }
}

library UuSharesLib {
    function asPrice(UuVault.Shares s) internal pure returns (UuPrice) {
        return UuPrice.wrap(UuVault.Shares.unwrap(s));
    }
}

contract UuVault {
    type Shares is uint128;

    struct Order {
        UuPrice price;
        uint256 qty;
    }

    using UuConv for uint256;
    using UuSharesLib for Shares;

    UuPrice public total;
    mapping(address => UuPrice) public balances;
    Shares internal supply;
    Order internal last;

    function deposit(UuPrice amount) external {
        UuPrice next = total + amount;
        total = next;
        balances[msg.sender] = balances[msg.sender] + amount;
    }

    function raw() external view returns (uint256) {
        return total.uuRaw();
    }

    function doubled() external view returns (UuPrice) {
        return total.uuDouble();
    }

    function fromRaw(uint256 x) external pure returns (UuPrice) {
        return UuPrice.wrap(x) + x.toPrice();
    }

    function mint(uint128 amount) external {
        supply = Shares.wrap(Shares.unwrap(supply) + amount);
    }

    function supplyPrice() external view returns (UuPrice) {
        return supply.asPrice();
    }

    function lastPrice() external view returns (UuPrice) {
        return last.price;
    }
}

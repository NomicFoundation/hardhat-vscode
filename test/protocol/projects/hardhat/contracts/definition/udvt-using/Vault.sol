// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

library Math {
    function scale(uint256 x, uint256 factor) internal pure returns (uint256) {
        return x * factor;
    }

    function scale(uint256 x) internal pure returns (uint256) {
        return x * 2;
    }
}

library Anything {
    function same(uint256 a, uint256 b) internal pure returns (bool) {
        return a == b;
    }
}

contract Vault {
    type Shares is uint128;

    using Math for uint256;
    using Anything for *;
    using SharesLib for Shares;

    Shares internal supply;

    function grow(uint256 amount) external pure returns (uint256) {
        return amount.scale(3) + amount.scale();
    }

    function matches(uint256 amount) external pure returns (bool) {
        return amount.same(1);
    }

    function mint(uint128 amount) external {
        supply = Shares.wrap(Shares.unwrap(supply) + amount);
    }

    function supplyRaw() external view returns (uint256) {
        return supply.toUint();
    }
}

library SharesLib {
    function toUint(Vault.Shares s) internal pure returns (uint256) {
        return Vault.Shares.unwrap(s);
    }
}

contract Reader {
    function read(Vault.Shares s) external pure returns (uint256) {
        return Vault.Shares.unwrap(s);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

type RnMoney is int256;

using {rnPlus as +, rnNeg as -} for RnMoney global;

function rnPlus(RnMoney a, RnMoney b) pure returns (RnMoney) {
    return RnMoney.wrap(RnMoney.unwrap(a) + RnMoney.unwrap(b));
}

function rnNeg(RnMoney a) pure returns (RnMoney) {
    return RnMoney.wrap(-RnMoney.unwrap(a));
}

contract RnWallet {
    RnMoney internal held;

    function credit(RnMoney amount) external {
        held = held + amount;
        held = rnPlus(held, amount);
    }

    function flip() external {
        held = -held;
    }
}

contract RnLedger {
    type RnMoney is uint64;

    RnMoney internal count;

    function bump() external {
        count = RnMoney.wrap(RnMoney.unwrap(count) + 1);
    }
}

// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

contract Ledger {
    enum Status {
        Pending,
        Settled
    }

    struct Entry {
        string label;
        Status status;
    }

    event Recorded(address indexed who, uint256 amount);

    error Rejected(string reason);

    uint256 public total;
    mapping(address => Entry) internal entries;

    constructor(uint256 initialTotal) {
        total = initialTotal;
    }

    function record(address who, uint256 amount) public returns (bool ok) {
        Entry memory entry;
        entry.label = "recorded";
        entries[who] = entry;
        emit Recorded(who, amount);
        ok = true;
    }
}

contract ExtendedLedger is Ledger {
    constructor() Ledger(0) {}
}

contract Unnamed {
    fallback() external {}

    receive() external payable {}
}

contract Empty {}

contract Creator {
    function make() public {
        new Ledger(1);
        new Empty();
    }
}

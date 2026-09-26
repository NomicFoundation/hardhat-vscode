// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

interface CtIRead {
    function read() external view returns (uint256);
}

interface CtIWrite {
    function write(uint256 value) external;
}

interface CtIStore is CtIRead, CtIWrite {
    struct CtEntry {
        uint256 key;
        uint256 value;
    }

    enum CtMode {
        Off,
        On
    }

    function entry(uint256 key) external view returns (CtEntry memory);

    function mode() external view returns (CtMode);
}

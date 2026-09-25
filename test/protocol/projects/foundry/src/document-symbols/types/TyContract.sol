// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract TyVault {
    type TyShare is uint256;

    enum TyStatus {
        Open,
        Closed
    }

    struct TyPosition {
        TyShare shares;
        TyStatus status;
    }

    TyPosition public position;

    function status() external view returns (TyStatus) {
        return position.status;
    }
}

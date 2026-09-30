// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IFnToken, FnGeo, FnVault} from "./FunctionsLib.sol";

contract FnCatalog {
    enum Kind {
        Small,
        Large
    }

    FnVault internal vault;

    function classify(uint256 v) public pure returns (FnGeo.Point memory p, Kind k) {
        p = FnGeo.Point(v, v);
        k = v > 10 ? Kind.Large : Kind.Small;
    }

    function count() public pure returns (uint256) {
        return 3;
    }

    function make(uint256 x) public pure returns (Kind) {
        return x > 10 ? Kind.Large : Kind.Small;
    }

    function make(uint256 x, uint256 y) public pure returns (FnGeo.Point memory) {
        return FnGeo.Point(x, y);
    }

    function build(Kind kind, uint256 x) public pure returns (uint256) {
        return kind == Kind.Large ? x * 2 : x;
    }

    function origin() public pure returns (FnGeo.Point memory result) {
        result.x = 1;
    }

    function internalCalls() external pure returns (uint256) {
        (FnGeo.Point memory p, Kind k) = classify(4);
        uint256 n = count();
        Kind first = make(1);
        FnGeo.Point memory second = make(1, 2);
        uint256 b = build({x: 1, kind: Kind.Large});
        FnGeo.Point memory s = FnGeo.scale(p, 2);
        return p.x + uint256(k) + n + uint256(first) + second.y + b + s.x;
    }

    function externalCalls() external returns (uint256) {
        FnVault.Receipt memory r = vault.deposit({amount: 1, asset: vault.token()});
        FnVault.Status st = vault.statuses(msg.sender);
        function(IFnToken, uint256) external returns (FnVault.Receipt memory) dep = vault.deposit;
        FnVault.Receipt memory r2 = dep(vault.token(), 2);
        return r.amount + r2.amount + uint256(st);
    }
}

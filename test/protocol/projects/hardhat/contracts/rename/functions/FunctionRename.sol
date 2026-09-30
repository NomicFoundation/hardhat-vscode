// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

interface FrnSource {
    function frnLoad() external view returns (uint256);

    function frnLoad(uint256 key) external view returns (uint256);
}

abstract contract FrnBase is FrnSource {
    function frnLoad() public view virtual override returns (uint256) {
        return block.number;
    }

    function frnLoad(uint256 key) external pure override returns (uint256) {
        return key;
    }
}

contract FrnImpl is FrnBase {
    function frnLoad() public view override returns (uint256) {
        return super.frnLoad() + 1;
    }

    function frnProbe(FrnSource source) external view returns (uint256) {
        return source.frnLoad() + source.frnLoad(2) + frnLoad();
    }
}

interface FrnCounter {
    function frnHits() external view returns (uint256);
}

contract FrnTally is FrnCounter {
    uint256 public override frnHits;

    function frnTick() external {
        frnHits += 1;
    }
}

contract FrnReader {
    function frnLevel() public pure returns (uint256) {
        return 2;
    }

    function frnShadowed(uint256 frnLevel) external pure returns (uint256) {
        return frnLevel * 2;
    }

    function frnOuter(FrnCounter counter) external view returns (uint256) {
        return frnLevel() + counter.frnHits();
    }
}

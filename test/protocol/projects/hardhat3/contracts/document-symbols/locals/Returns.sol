// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract LcCallee {
    function get(uint256 x) external pure returns (uint256, bool) {
        require(x > 0, "zero");
        return (x, true);
    }
}

contract LcReturns {
    LcCallee private callee;

    function pair() internal pure returns (uint256, uint256) {
        return (1, 2);
    }

    function triple() internal pure returns (uint256, bool, address) {
        return (1, true, address(0));
    }

    function destructure() public pure returns (uint256) {
        (uint256 first, uint256 second) = pair();
        (, bool flag, ) = triple();
        return flag ? first : second;
    }

    function named(uint256 x) public pure returns (uint256 sum, uint256 product) {
        uint256 base = x + 1;
        sum = base + x;
        product = base * x;
    }

    function attemptReturns(uint256 x) public view returns (uint256) {
        try callee.get(x) returns (uint256 value, bool ok) {
            uint256 okLocal = ok ? value : 0;
            return okLocal;
        } catch {
            return 0;
        }
    }

    function attemptCatches(uint256 x) public view returns (uint256) {
        try callee.get(x) {
            return 1;
        } catch Error(string memory reason) {
            uint256 reasonLength = bytes(reason).length;
            return reasonLength;
        } catch Panic(uint256 code) {
            return code;
        } catch (bytes memory data) {
            uint256 dataLength = data.length;
            return dataLength;
        }
    }
}

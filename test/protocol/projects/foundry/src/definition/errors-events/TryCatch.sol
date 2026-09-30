// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract EECallee {
    function value() external pure returns (uint256) {
        return 42;
    }
}

contract EECaller {
    EECallee private callee = new EECallee();

    function run() external view returns (uint256 out, string memory why, uint256 code, bytes memory raw) {
        try callee.value() returns (uint256 v) {
            out = v;
        } catch Error(string memory reason) {
            why = reason;
        } catch Panic(uint256 errorCode) {
            code = errorCode;
        } catch (bytes memory data) {
            raw = data;
        }
    }
}

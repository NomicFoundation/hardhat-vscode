// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.3;

interface AddNumbers { function add(uint256 a, uint256 b) external returns (uint256 c); }

contract Example {
    AddNumbers addContract;
    event StringFailure(string stringFailure);
    event BytesFailure(bytes bytesFailure);

    function exampleFunction(uint256 _a, uint256 _b) public returns (uint256 _c) {

        try addContract.add(_a, _b) returns (uint256 _value) {
            return (_value);
        } catch Error(string memory _err) {
            // This may occur if there is an overflow with the two numbers and the `AddNumbers` contract explicitly fails with a `revert()`
            emit StringFailure(_err);
        } catch (bytes memory _err) {
            emit BytesFailure(_err);
        }
    }
}

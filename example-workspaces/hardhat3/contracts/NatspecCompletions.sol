// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title Testing Lib
 * @author nomic team
 * @notice An example lib
 * @dev Even from a dev poihnt of view
 */
library ExampleLibrary {

}

/**
 * @title Testing interface
 * @author nomic team
 * @notice more of a notice
 * @dev a dev instruction
 */
interface ExampleInterface {

}

/**
 * @title The example for extraction
 * @author the nomic team
 * @notice Used in testing
 */
contract ExampleContract {
    /**
     * @notice A public counter
     */
    uint public publicCounter;

    /**
     * @dev a private counter
     */
    uint privateCounter;

    /// An event with a notice
    /// @param a first
    /// @param b second
    event MyEvent(uint a, uint b);

    /**
     * Some explanation of one returns
     */
    function myFunctionOneReturns() public returns (string memory one) {}

    /**
     * Some notice like explanation
     * @return one the first
     * @return two the second
     */
    function myFunctionTwoReturns()
        public
        returns (string memory one, address two)
    {}
}

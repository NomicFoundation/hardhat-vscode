// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

enum MyEnum {
    VALUE, // comment
    ANOTHER_VALUE /* another comment */
}

/// @title A simulator for trees
/// @author Larry A. Gardner
/// @notice You can use this contract for only the most basic simulation
/// @dev All function calls are currently implemented without side effects
/// @custom:experimental-fun This is an experimental contract.
contract Tree {
    /// @notice Calculate tree age in years, rounded up, for live trees
    /// @dev The Alexandr N. Tetearing algorithm could increase precision
    /// @param rings The number of rings from dendrochronological sample
    /// @return output1 Age in years, rounded up for partial years
    function age(
        uint256 rings // a comment on rings
        ) 
        external
        pure
        virtual // and another thing while we are at it
        returns (
            uint256 output1 // a name
            ) {
        return rings + 1;
    }

    /// @notice Returns the amount of leaves the tree has.
    /// @dev Returns only a fixed number.
    function leaves() external pure virtual returns (uint256) {
        return 2;
    }

    /**
     * @custom:asdf and more more
     * @custom:asdf-a and more more
     * @custom:a-a and more more
     */
    function customTags() external pure virtual returns (uint256) {
        return 2;
    }

    // /**
    //  * @custom:-asdf and more more
    //  * @custom:asdf123 and more more
    //  * @custom:Asdf and more more
    //  */
    // function badCustomTags() external pure virtual returns (uint256) {
    //     return 2;
    // }
}

contract Plant {
    function leaves() external pure virtual returns (uint256) {
        return 3;
    }
}

contract KumquatTree is Tree, Plant {
    function age(uint256 rings) external pure override returns (uint256) {
        return rings + 2;
    }

    /// Return the amount of leaves that this specific kind of tree has
    /// @inheritdoc Tree
    function leaves() external pure override(Tree, Plant) returns (uint256) {
        return 3;
    }
}

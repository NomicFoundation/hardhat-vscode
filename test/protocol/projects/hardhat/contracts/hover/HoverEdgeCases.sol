// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract EdgeCases {
    // State variable with a string initializer containing `{` and `=` —
    // the string-based truncation (indexOf("{"), top-level "=" scan) would
    // truncate inside the literal and produce malformed hover text.
    string public templateName = "user_{id}=ok";

    /// @notice (1) uses parens in natspec, even nested ( like this )
    /// @param amount the (special) value
    function withCommentParens(uint256 amount) public pure returns (uint256) {
        return amount;
    }

    function callerOfWithCommentParens() public pure returns (uint256) {
        return withCommentParens(42);
    }
}

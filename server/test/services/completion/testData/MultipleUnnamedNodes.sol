contract Test {
    function MultipleUnnamedNodes() public pure returns (uint256) {
        if (true) {
            uint256 item = 1234;
            i;
        }
    }
}

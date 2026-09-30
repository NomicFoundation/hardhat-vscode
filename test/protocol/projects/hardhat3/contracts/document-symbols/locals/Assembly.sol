// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract LcAssembly {
    function yulLets(uint256 n) public pure returns (uint256) {
        uint256 seed = n;
        uint256 result;
        assembly {
            let doubled := mul(seed, 2)
            {
                let scoped := 1
                doubled := add(doubled, scoped)
            }
            for { let i := 0 } lt(i, n) { i := add(i, 1) } {
                let step := i
                doubled := add(doubled, step)
            }
            result := doubled
        }
        return result;
    }

    function yulFunctions(uint256 x) public pure returns (uint256) {
        uint256 result;
        assembly {
            function square(v) -> r {
                r := mul(v, v)
            }
            function pair() -> p, q {
                let t := 1
                p := t
                q := add(t, 1)
            }
            let a, b := pair()
            result := add(square(x), add(a, b))
        }
        return result;
    }
}

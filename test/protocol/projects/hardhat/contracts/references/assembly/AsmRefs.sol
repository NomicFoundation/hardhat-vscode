// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract AsmRefs {
    uint256 private constant FACTOR = 3;
    uint256 private stored;

    function mixed(uint256 base) external pure returns (uint256 total) {
        uint256 offset = base + FACTOR;
        assembly {
            // base is only named here in a comment
            let label := "base"
            total := add(base, offset)
        }
        total = total + base;
        assembly {
            total := mul(total, FACTOR)
        }
    }

    function write(uint256 v) external {
        stored = v;
        assembly {
            sstore(stored.slot, add(sload(stored.slot), v))
        }
    }

    function first() external pure returns (uint256 x) {
        assembly {
            function helper(p) -> q {
                q := add(p, 1)
            }
            let tmp := helper(1)
            x := helper(tmp)
        }
    }

    function second() external pure returns (uint256 y) {
        assembly {
            function helper(p) -> q {
                q := mul(p, 2)
            }
            let tmp := helper(2)
            y := tmp
        }
    }
}

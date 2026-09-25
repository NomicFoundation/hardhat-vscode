// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract AssemblyDefs {
    uint256 private constant SCALE = 1000;
    uint128 private packedA;
    uint128 private packedB;
    uint256 private total;

    function locals(uint256 amount) external pure returns (uint256 result) {
        uint256 bonus = 7;
        assembly {
            let doubled := mul(amount, 2)
            result := add(doubled, mul(bonus, SCALE))
        }
    }

    function storageSlots() external view returns (uint256 t, uint256 b) {
        assembly {
            t := sload(total.slot)
            b := shr(mul(packedB.offset, 8), sload(packedB.slot))
        }
    }

    function calldataArray(uint256[] calldata xs) external pure returns (uint256 o, uint256 l) {
        assembly {
            o := xs.offset
            l := xs.length
        }
    }

    function yulFunctions(uint256 n) external pure returns (uint256 out) {
        assembly {
            let acc := triple(n)
            function triple(a) -> r {
                if iszero(a) { leave }
                r := mul(a, 3)
            }
            for { let i := 0 } lt(i, n) { i := add(i, 1) } {
                let step := triple(i)
                {
                    let inner := add(step, 1)
                    acc := add(acc, inner)
                }
            }
            out := acc
        }
    }

    function target() external pure {}

    function pointer() external view returns (address a, uint256 s) {
        address fp = address(this);
        assembly {
            a := fp
            s := 0x1
        }
    }
}

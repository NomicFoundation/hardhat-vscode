// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract YulExample {
    function calculateSomething() public view returns (uint256 something) {
        // assembly {
        //     function _getCurrentRate() -> multiplier {
        //         let pe := sload(periodEnd.slot)
        //         let ps := sload(periodStart.slot)
        //         let rate := sload(compoundRate.slot)
        //         if lt(timestamp(), pe) {
        //             multiplier := add(
        //                 mul(sub(timestamp(), ps), rate),
        //                 1000000000000000000
        //             )
        //         }
        //         if iszero(lt(timestamp(), pe)) {
        //             multiplier := 2000000000000000000
        //         }
        //     }
        //     let a := 123456789
        //     let rate := _getCurrentRate()
        //     something := mul(a, rate)
        // }
    }
}

// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "hardhat/console.sol";

// library Lib {
//     type UserType is uint256;

//     function withMappingParams(
//         mapping(address => uint) memory paramSimpleMapping,
//         mapping(address => string[]) memory paramNestedArrayMapping,
//         mapping(UserType => UserType) memory paramUserTypeMapping,
//         mapping(address => mapping(address => uint))
//             memory paramNestedMapMapping
//     ) public view returns (string memory output) {
//         console.log(paramSimpleMapping[msg.sender]);
//         console.log(UserType.unwrap(paramUserTypeMapping[UserType.wrap(123)]));
//         console.log(paramNestedArrayMapping[msg.sender].length);
//         console.log(paramNestedMapMapping[msg.sender][msg.sender]);

//         this.withMappingParams(
//             paramSimpleMapping,
//             paramUserTypeMapping,
//             paramNestedArrayMapping,
//             paramNestedMapMapping
//         );

//         return "";
//     }
// }

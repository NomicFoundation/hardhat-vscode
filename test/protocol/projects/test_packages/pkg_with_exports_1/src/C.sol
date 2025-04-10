// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import 'pkg_without_exports_1/src/A.sol';
import 'pkg_with_exports_2/D.sol';

contract C {
  A a;
  D d;
}

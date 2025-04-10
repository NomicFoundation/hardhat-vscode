// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import 'pkg_with_exports_1/C.sol';
import 'pkg_with_exports_2_through_remapping/D.sol';

contract Local3 {
  C c;
  D d;
}

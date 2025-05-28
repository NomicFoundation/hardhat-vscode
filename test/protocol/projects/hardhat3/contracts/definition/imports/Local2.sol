// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import 'pkg_without_exports_1/src/A.sol';
import 'pkg_without_exports_2_through_remapping/B.sol';

contract Local2 {
  A a;
  B b;
}

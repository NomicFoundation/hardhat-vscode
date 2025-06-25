// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import './Local2.sol'; // relative
// import 'contracts/definition/imports/Local3.sol'; // direct - no longer supported
import 'local/Local4.sol'; // remapped

contract Local1 {
  Local2 l2;
  // Local3 l3;
  Local4 l4;
}

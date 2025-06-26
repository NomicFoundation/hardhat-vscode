// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import './A2.sol';
import 'this_src/A3.sol'; // local import through remapping
import 'foo1/B.sol'; // to other npm package through remapping

contract A {
  A2 a2;
  A3 a3;
  B b;
}

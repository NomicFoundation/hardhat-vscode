// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import '@lib/myLib/Imported.sol';
import '@myLib/OtherImported.sol';

contract Importer {
  Imported i1;
  OtherImported i2;
}

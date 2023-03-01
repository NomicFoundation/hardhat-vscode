// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.7;

import "@localoz/access/Ownable.sol"; // Local imports
import "bar/Bar.sol"; // root import
import "./baz/Baz.sol"; // relative import

contract Testing is Ownable {
    Baz baz;
    Bar bar;
}
// contract Testing is Ownable, ERC20, Foo {}

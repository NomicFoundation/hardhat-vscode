// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.7;

import "@openzeppelin/access/Ownable.sol"; // Specifying github repo

// import "@dapptools/erc20.sol"; // Specifying github repo, branch and contracts folder
// import "@localoz/token/ERC20/ERC20.sol"; // Local imports
import "bar/Bar.sol"; // root import
import "./baz/Baz.sol"; // relative import

contract Testing is Ownable {
    Baz baz;
    Bar bar;
}
// contract Testing is Ownable, ERC20, Foo {}

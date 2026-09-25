// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

// On format the semi-colon after virtual shouldn't be stripped
abstract contract Foo {
    modifier bar() virtual;
}

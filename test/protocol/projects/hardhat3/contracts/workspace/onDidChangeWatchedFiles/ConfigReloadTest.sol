// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

// This contract is used to test that the extension correctly reloads the
// project when the hardhat.config.ts file changes.

// It has an import to be resolved through remappings, so depending on the config
// it would show a diagnostic or not

import 'pkg_without_exports_2_through_remapping/B.sol';

contract ConfigReloadTest {}

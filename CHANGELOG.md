# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## v0.1.0 - 2022-03-10

### Changed

- Update docs and extension page to list features and public contact points

### Fixed

- Multiple fixes to validation, quick fixes and navigation on windows

## v0.0.24 - 2022-03-04

### Added

- Expose the telemetry enable/disable switch in the extension settings

### Changed

- Smaller extension install size due to the inclusion of bundling and minification

### Fixed

- Fix for indexing popup not going away when there are no sol files found

## v0.0.23 - 2022-02-24

### Added

- Import completion improvements including direct imports based on `node_module` indexing

### Fixed

- Fix for memory leak in compilation
- Syntax fixes
  - include missing operators in highlighting (modulo and not equal)
  - remove comment todo tags special highlighting
- Function navigation fixes
  - find implementation for functions now excludes function definitions that are on interfaces or are abstract in an abstract class
  - when finding the defining function, use the cardinality of the parameter list
- Validation fix to trigger validation on open docs at vscode startup

## v0.0.22 - 2022-02-09

### Added

- Add quickfixes for:
  - implementing interfaces in response to `solidity error 3656`
  - constraining mutability (adding the view/pure keyword) in response to `solidity warning 2018`
  - specifying the visibility in response to `solidity error 4937`
  - adding virtual keyword in response to `solidity error 4334`
  - adding override keyword in response to `solidity error 9456` or `solidity error 4327`

### Changed

- bump minimum version of vscode to 1.63 and depend on node 14

### Fixed

- bug fix for compiler warnings/errors not appearing

## 0.0.21 - 2022-01-18

### Changed

- Update bundled version of prettier

### Fixed

- Fix the implementation of go to definition for constructors

## 0.0.20 - 2021-12-21

### Added

- Improve external dependency resolution for Daptools
- Added warning about potential conflicts with other .sol extension

## 0.0.19 - 2021-12-21 [YANKED]

- Immediately replaced by `0.0.20`, due to initial publishing issues

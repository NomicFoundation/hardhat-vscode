# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## 0.2.2 - 2022-04-01

### Changed

- Change to telemetry, to stop capturing unhandled exceptions on the client ((#156)[https://github.com/NomicFoundation/hardhat-vscode/issues/156])

## 0.2.1 - 2022-03-31

### Removed

- Remove unnecessary setting for turning off formatting, use vscode formatting config if you want to turn Hardhat VSCode formatting off ((#102)[https://github.com/NomicFoundation/hardhat-vscode/issues/102])

### Fixed

- Fix for validation child_process cancelling ((#89)[https://github.com/NomicFoundation/hardhat-vscode/issues/89])
- Fix to suppress parser errors in quickfixes ((#146)[https://github.com/NomicFoundation/hardhat-vscode/issues/146])
- Fix to not throw on hh error objects with no source location ((#147)[https://github.com/NomicFoundation/hardhat-vscode/issues/147])

## 0.2.0 - 2022-03-24

### Added

- Hover info for variables, function calls, error reverts and event emits ([#62](https://github.com/NomicFoundation/hardhat-vscode/issues/62))

## v0.1.2 - 2022-03-22

### Added

- Constrain solidity warning 5574 to the contract name ([#130](https://github.com/NomicFoundation/hardhat-vscode/pull/130))

### Changed

- Improve performance telemetry (use sampling to reduce noise) ([#131](https://github.com/NomicFoundation/hardhat-vscode/pull/131))

### Fixed

- Fix for google analytics unhandled exceptions ([#128](https://github.com/NomicFoundation/hardhat-vscode/pull/128))

## v0.1.1 - 2022-03-17

### Changed

- Improve the logging of validation pipeline failures
- Suppress parser errors in the log ([#90](https://github.com/NomicFoundation/hardhat-vscode/issues/90))
- Suppress unknown signal log and add logging of validation timeouts ([#89](https://github.com/NomicFoundation/hardhat-vscode/issues/89))

### Fixed

- Fix to stop analytics request failure affecting LSP commands
- Fix contract renames, by stopping it renaming the constructor ([#94](https://github.com/NomicFoundation/hardhat-vscode/issues/94))
- Fix to stop error on import completion on full file path

## v0.1.0 - 2022-03-10

### Changed

- Public beta release of extension and Solidity Language Server features

## v0.0.2 - 2022-03-10

### Changed

- Installation links in readme/extension text

## v0.0.1 - 2022-03-10

### Added

- Test release of marketplace infrastructure

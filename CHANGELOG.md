# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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

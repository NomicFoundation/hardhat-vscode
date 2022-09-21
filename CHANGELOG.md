# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## 0.5.3 - 2022-09-21

### Added

- Added support for remappings.txt file ([#237](https://github.com/NomicFoundation/hardhat-vscode/pull/237))
- Add forge formatter as a formatting option ([#239](https://github.com/NomicFoundation/hardhat-vscode/pull/239))
- Auto insert semicolon on import completion ([#104](https://github.com/NomicFoundation/hardhat-vscode/pull/104))

### Fixed

- Opening hardhat.config file fails on vscode web ([#227](https://github.com/NomicFoundation/hardhat-vscode/issues/227))
- Incorrect diagnostic ranges on files with multibyte unicode characters ([#248](https://github.com/NomicFoundation/hardhat-vscode/issues/248))

## 0.5.2 - 2022-09-08

### Added

- Added diagnostic for hardhat error 411 - library not installed ([#242](https://github.com/NomicFoundation/hardhat-vscode/issues/242))
- Added task provider and commands ([#70](https://github.com/NomicFoundation/hardhat-vscode/issues/70))
- Added link to error file on incorrect imports ([#238](https://github.com/NomicFoundation/hardhat-vscode/issues/238))

## 0.5.1 - 2022-08-18

### Added

- Added quickfix for partially-specified multi override contract functions ([#50](https://github.com/NomicFoundation/hardhat-vscode/issues/50))
- Added quickfix for missing license identifier ([#26](https://github.com/NomicFoundation/hardhat-vscode/issues/26))

### Fixed

- Fix open files not being analyzed because of validator not being ready ([#229](https://github.com/NomicFoundation/hardhat-vscode/issues/229))

## 0.5.0 - 2022-08-11

### Added

- Added Quickfix for missing solidity compiler version pragma ([#25](https://github.com/NomicFoundation/hardhat-vscode/issues/25))

### Fixed

- Fix to validation to clear diagnostics when all warnings/errors are in files other than the open editor ([#221](https://github.com/NomicFoundation/hardhat-vscode/issues/221))
- Fix to formatting to not remove semi-colons on virtual modifiers ([#219](https://github.com/NomicFoundation/hardhat-vscode/issues/219))
- Fix to completions for `msg.sender` ([#202](https://github.com/NomicFoundation/hardhat-vscode/issues/202))

## 0.4.6 - 2022-08-04

### Added

- Added auto-insert of intermediary stars in block comments ([#75](https://github.com/NomicFoundation/hardhat-vscode/issues/75))

## 0.4.5 - 2022-07-21

### Fixed

- Fix for restarts on invalid hardhat configs ([#212](https://github.com/NomicFoundation/hardhat-vscode/pull/212))

## 0.4.4 - 2022-07-18

### Fixed

- Fix to restart validation processes on unexpected exits ([#209](https://github.com/NomicFoundation/hardhat-vscode/pull/209))

## 0.4.3 - 2022-06-13

### Fixed

- Fix sync between file on disk/open editor for import line validation ([#201](https://github.com/NomicFoundation/hardhat-vscode/issues/201))

## 0.4.2 - 2022-06-09

### Changed

- Speed up validation by caching solc input for the same page ([#198](https://github.com/NomicFoundation/hardhat-vscode/pull/198))
- Speed up validation by removing code generation steps from solc ([#197](https://github.com/NomicFoundation/hardhat-vscode/pull/197))

## 0.4.1 - 2022-06-08

### Added

- A detailed feature section with gifs to the docs ([#159](https://github.com/NomicFoundation/hardhat-vscode/issues/159))

### Changed

- Faster validation by caching compiler metadata ([#196](https://github.com/NomicFoundation/hardhat-vscode/pull/196))

### Fixed

- Better reporting of no worker on restarts ([#193](https://github.com/NomicFoundation/hardhat-vscode/issues/193))

## 0.4.0 - 2022-05-26

### Added

- Reflect changes to hardhat config in validation ([#188](https://github.com/NomicFoundation/hardhat-vscode/pull/188))
- Show validation preprocessing errors against `solidity` in the status bar ([#148](https://github.com/NomicFoundation/hardhat-vscode/issues/148))

### Changed

- Improve validation speed by reducing number of repeated steps ([#188](https://github.com/NomicFoundation/hardhat-vscode/pull/188))

### Fixed

- Reduce ram spikes from large numbers of validation processes ([#140](https://github.com/NomicFoundation/hardhat-vscode/issues/140))
- Stop `getUnsavedDocuments` timeouts ([#187](https://github.com/NomicFoundation/hardhat-vscode/issues/187))

## 0.3.2 - 2022-05-10

### Fixed

- Include completions for arrays for variables and member accesses ([#179](https://github.com/NomicFoundation/hardhat-vscode/issues/179))
- Change extensionKind to workspace only, to ensure always has access to workspace files ([#182](https://github.com/NomicFoundation/hardhat-vscode/issues/182))
- Fix in renames to ignore dead nodes in the ast when calculating updates ([#184](https://github.com/NomicFoundation/hardhat-vscode/pull/184))

## 0.3.1 - 2022-05-05

### Added

- Display **Hardhat** import errors against the import line ([#154](https://github.com/NomicFoundation/hardhat-vscode/issues/154))
- Add support for optional argument names in return NatSpec tags ([#168](https://github.com/NomicFoundation/hardhat-vscode/issues/168))
- Add Hardhat project usage explanation to docs, documenting how the compiler is inferred ([#135](https://github.com/NomicFoundation/hardhat-vscode/issues/135))

### Changed

- Include explicit extensionKind ([#120](https://github.com/NomicFoundation/hardhat-vscode/pull/120))

### Fixed

- Stop validation timeout warning in logs (close the validation process on error) ([#144](https://github.com/NomicFoundation/hardhat-vscode/issues/144))

## 0.3.0 - 2022-05-02

### Added

- Support for inline validation in monorepos ([#138](https://github.com/NomicFoundation/hardhat-vscode/issues/138))
- Show a warning if file is not part of a Hardhat project ([#56](https://github.com/NomicFoundation/hardhat-vscode/issues/56))
- Add instructions for configuring formatting ([#164](https://github.com/NomicFoundation/hardhat-vscode/pull/164))
- Support for custom natspec tags ([#161](https://github.com/NomicFoundation/hardhat-vscode/issues/161))

### Fixed

- Turn off home directory scanning ([#126](https://github.com/NomicFoundation/hardhat-vscode/issues/126))
- Allow comments in enums ([#165](https://github.com/NomicFoundation/hardhat-vscode/issues/165))

## 0.2.2 - 2022-04-01

### Changed

- Change to telemetry, to stop capturing unhandled exceptions on the client ([#156](https://github.com/NomicFoundation/hardhat-vscode/issues/156))

## 0.2.1 - 2022-03-31

### Removed

- Remove unnecessary setting for turning off formatting, use vscode formatting config if you want to turn **Hardhat for Visual Studio Code** formatting off ([#102](https://github.com/NomicFoundation/hardhat-vscode/issues/102))

### Fixed

- Fix for validation child_process cancelling ([#89](https://github.com/NomicFoundation/hardhat-vscode/issues/89))
- Fix to suppress parser errors in quickfixes ([#146](https://github.com/NomicFoundation/hardhat-vscode/issues/146))
- Fix to not throw on hh error objects with no source location ([#147](https://github.com/NomicFoundation/hardhat-vscode/issues/147))

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

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## 0.8.4 - 2024-06-24

### Added

- add markdown syntax support ([575](https://github.com/NomicFoundation/hardhat-vscode/pull/575))
- Bump Slang to 0.15.1 ([578](https://github.com/NomicFoundation/hardhat-vscode/pull/578))

## 0.8.3 - 2024-05-08

### Added

- add support for region comments ([526](https://github.com/NomicFoundation/hardhat-vscode/pull/526))
- Bump Slang to 0.14.2 ([565](https://github.com/NomicFoundation/hardhat-vscode/pull/565))

## 0.8.2 - 2024-04-22

### Added

- Run Semantic Highlighting and document symbols on later solc versions not yet support by the Slang parser (behind feature flag) ([562](https://github.com/NomicFoundation/hardhat-vscode/pull/562))

## 0.8.1 - 2024-04-18

### Fixed

- Fix packaging file inclusions on the language server ([558](https://github.com/NomicFoundation/hardhat-vscode/issues/558))

## 0.8.0 - 2024-04-17

### Added

- Enable Semantic Highlighting and document symbols behind feature flag ([#523](https://github.com/NomicFoundation/hardhat-vscode/pull/523))

## 0.7.3 - 2023-06-01

### Fixed

- Issue with missing telemetry code ([#501](https://github.com/NomicFoundation/hardhat-vscode/pull/501))

## 0.7.2 - 2023-05-24

### Fixed

- Load truffle config in child process to avoid unhandled exceptions ([#492](https://github.com/NomicFoundation/hardhat-vscode/issues/492))
- Catch exceptions during truffle initialization scan for global `node_modules` ([#486](https://github.com/NomicFoundation/hardhat-vscode/issues/486))
- Highlight `@inheritdoc` within natspec comments ([#489](https://github.com/NomicFoundation/hardhat-vscode/pull/489))

## 0.7.1 - 2023-05-03

### Fixed

- Support absolute path remappings on foundry projects ([#476](https://github.com/NomicFoundation/hardhat-vscode/issues/476))
- Stop Truffle initialization errors escaping adapter context ([#473](https://github.com/NomicFoundation/hardhat-vscode/issues/473))
- Fix sync `forge fmt` calls that block the langauge server ([#462](https://github.com/NomicFoundation/hardhat-vscode/issues/462))
- Fix node 14 support for the language server ([#461](https://github.com/NomicFoundation/hardhat-vscode/issues/461))

## 0.7.0 - 2023-04-26

### Added

- Experimental support for Truffle projects ([#45](https://github.com/NomicFoundation/hardhat-vscode/issues/45))
- Experimental support for Ape projects ([#391](https://github.com/NomicFoundation/hardhat-vscode/issues/391))

## 0.6.16 - 2023-04-18

### Changed

- Move formatting to language server, to allow use from CoC ([#300](https://github.com/NomicFoundation/hardhat-vscode/issues/300))

### Fixed

- Suppress file access errors on scans ([#448](https://github.com/NomicFoundation/hardhat-vscode/issues/448))

## 0.6.15 - 2023-03-30

### Added

- Type Names and arrays syntax highlighting ([#385](https://github.com/NomicFoundation/hardhat-vscode/issues/385))

### Fixed

- Environment variable clash with `NODE_ENV` ([#439](https://github.com/NomicFoundation/hardhat-vscode/issues/439))

## 0.6.14 - 2023-03-20

### Fixed

- `Missing content-length header` error on vim-coc extension.

## 0.6.13 - 2023-03-16

### Added

- auto-import for Hardhat console.log ([#244](https://github.com/NomicFoundation/hardhat-vscode/issues/244))

### Fixed

- Forge fmt use with monorepos ([#410](https://github.com/NomicFoundation/hardhat-vscode/issues/410))
- Highlight user-defined value types ([#420](https://github.com/NomicFoundation/hardhat-vscode/issues/420))
- Update project metadata on file renames/deletes ([#387](https://github.com/NomicFoundation/hardhat-vscode/issues/387))

## 0.6.12 - 2023-03-08

### Added

- notifications for project-level errors
- re-validate documents when changing editor windows

### Changed

- updated prettier-plugin-solidity to support named mapping params
- updated node-languageserver package to reduce protocol errors on vim.coc

## 0.6.11 - 2023-02-23

### Changed

- improve forge fmt speed through caching ([#380](https://github.com/NomicFoundation/hardhat-vscode/issues/380))
- throttle project initalization to cap max cpu usage ([#389](https://github.com/NomicFoundation/hardhat-vscode/issues/389))

## 0.6.10 - 2023-02-20

### Changed

- Optimize initial indexing by only analysing local files ([#302](https://github.com/NomicFoundation/hardhat-vscode/issues/302))
- Reduced deps for coc-solidity ([#373](https://github.com/NomicFoundation/hardhat-vscode/issues/373))

### Fixed

- Mimic foundry solc input mapping ([#377](https://github.com/NomicFoundation/hardhat-vscode/pull/377))

## 0.6.9 - 2023-01-20

### Added

- Natspec completions ([#342](https://github.com/NomicFoundation/hardhat-vscode/issues/342))([#343](https://github.com/NomicFoundation/hardhat-vscode/issues/343))([#296](https://github.com/NomicFoundation/hardhat-vscode/issues/296))
- Updated parser to support latest solidity syntax

### Fixed

- Improve forge binary lookup ([#354](https://github.com/NomicFoundation/hardhat-vscode/pull/354))
- Fix logic on checking workspace folder capability ([#375](https://github.com/NomicFoundation/hardhat-vscode/pull/375))

## 0.6.8 - 2023-01-16

### Added

- Provide cli invocation for standalone language server ([#341](https://github.com/NomicFoundation/hardhat-vscode/issues/341))

### Changed

- Re-ask to allow telemetry ([#370](https://github.com/NomicFoundation/hardhat-vscode/pull/370))
- Refine telemetry for coc and different development frameworks ([#320](https://github.com/NomicFoundation/hardhat-vscode/issues/320), [#338](https://github.com/NomicFoundation/hardhat-vscode/issues/338) & [#340](https://github.com/NomicFoundation/hardhat-vscode/issues/340))

## 0.6.7 - 2023-01-09

### Added

- Quickfix for non checksummed addresses ([#321](https://github.com/NomicFoundation/hardhat-vscode/issues/321))
- Track timing on analysis ([#332](https://github.com/NomicFoundation/hardhat-vscode/issues/332))
- Add `encodeCall` completion to `abi` ([#319](https://github.com/NomicFoundation/hardhat-vscode/issues/319))

### Fixed

- Status item links on windows ([#288](https://github.com/NomicFoundation/hardhat-vscode/issues/288))
- Foundry validation on windows ([#355](https://github.com/NomicFoundation/hardhat-vscode/issues/355))

## 0.6.6 - 2022-12-22

### Changed

- Updated logo and extension naming in docs ([#311](https://github.com/NomicFoundation/hardhat-vscode/pull/311))

### Fixed

- Forge fmt respects project's foundry.toml ([#316](https://github.com/NomicFoundation/hardhat-vscode/pull/316))

## 0.6.5 - 2022-12-21

### Added

- Custom protocol testing framework + test suite

### Fixed

- Bundled extension properly, including hardhat 2.12.4 which fixes the `.js on undefined` error on solcjs users.

## 0.6.4 - 2022-12-15

### Added

- Solidity survey 2022 invitation ([#312](https://github.com/NomicFoundation/hardhat-vscode/issues/312))

### Fixed

- Updated hardhat version to latest, fixing validation for solcjs users ([#305](https://github.com/NomicFoundation/hardhat-vscode/issues/305))
- Improved foundry import resolution ([#308](https://github.com/NomicFoundation/hardhat-vscode/pull/308))

## 0.6.3 - 2022-12-01

### Fixed

- Fixed validation with solcjs ([#294](https://github.com/NomicFoundation/hardhat-vscode/issues/294))
- Suppress output channel warnings around worker exit codes ([#298](https://github.com/NomicFoundation/hardhat-vscode/pull/298))

### Changed

- cache solc compiler paths for all adapters ([#299](https://github.com/NomicFoundation/hardhat-vscode/pull/299))

## 0.6.2 - 2022-11-25

### Fixed

- Fix issue with calling fstat on non existent files
- Fix validation not working on files with whitespaces on their path ([#289](https://github.com/NomicFoundation/hardhat-vscode/pull/289))

## 0.6.1 - 2022-11-24

### Added

- Quickfixes for adding/removing data location keywords ([#281](https://github.com/NomicFoundation/hardhat-vscode/pull/281))

### Changed

- Update the version of `prettier-plugin-solidity` ([#282](https://github.com/NomicFoundation/hardhat-vscode/pull/282))

### Fixed

- Suppress errors when encountering a folder with a `.sol` ending ([#285](https://github.com/NomicFoundation/hardhat-vscode/pull/285))

## 0.6.0 - 2022-11-21

### Added

- Validation for "standalone" solidity files not belonging to any project
- Experimental support for pure foundry projects and hybrid hardhat - foundry projects.
- Faster validation by tuning solc settings

### Fixed

- Validation blocked on the entire project when there's an invalid import on a single file ([#238](https://github.com/NomicFoundation/hardhat-vscode/issues/238))
- "Validator blocked" error before extension finished analysis stage
- Improved error messaging on failure to load hardhat

## 0.5.5 - 2022-10-06

### Fixed

- Attempting to validate non-hardhat contracts triggering a task error ([#255](https://github.com/NomicFoundation/hardhat-vscode/issues/255))

## 0.5.4 - 2022-09-27

### Fixed

- Validation not working on windows with the latest hardhat version ([#264](https://github.com/NomicFoundation/hardhat-vscode/issues/264))

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

- Remove unnecessary setting for turning off formatting, use vscode formatting config if you want to turn formatting off ([#102](https://github.com/NomicFoundation/hardhat-vscode/issues/102))

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

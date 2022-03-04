# Welcome to the Hardhat VSCode beta!

Thanks for helping us improve the extension before its initial release.

We are looking to learn more from your experience using the extension, so please let us know about any errors, missing features that other extensions have, or even features that you haven't seen anywhere else.

Please read this document before starting to use the extension

## Setting up the extension

The extension should work without any kind of configuration, just make sure you disabled any other Solidity extension to avoid unwanted interactions.

## Sharing your feedback

If you want to report an issue, suggest an improvement, ask a question about the extension, or request a new feature, please open an issue in [this repository](https://github.com/nomiclabs/hardhat-vscode-feedback).

Including clear instructions to reproduce your issue and example code (preferably a link to a repository) would be much appreciated.

## Inviting other people to the beta

Please, don't share the link to the extension as it's not ready to be launched.

If you want to share it with someone, let us know about it in [this issue](https://github.com/nomiclabs/hardhat-vscode-feedback/issues/9) and we'll move them to the front of the waitlist. We'll invite them as soon as we know we can process more feedback.

## Known issues/limitations

- Truffle support is incomplete: compilation errors are not shown.
- Brownie support is incomplete: compilation errors are not shown.
- Daptools support is incomplete: compilation errors are not shown.
- Foundry support is incomplete: external dependencies are not resolved correctly, and compilation errors are not shown.

## Changelog

### v0.0.24

- fix for indexing popup not going away when there are no sol files found
- Expose the telemetry enable/disable switch in the extension settings
- Smaller extension install size due to the inclusion of bundling and minification

### v0.0.23

- Fix for memory leak in compilation
- Import completion improvements and fixes, including direct imports based on `node_module` indexing
- Syntax fixes
  - include missing operators in highlighting (modulo and not equal)
  - remove comment todo tags special highlighting
- Function navigation fixes
  - find implementation for functions now excludes function definitions that are on interfaces or are abstract in an abstract class
  - when finding the defining function, use the cardinality of the parameter list
- Validation fix to trigger validation on open docs at vscode startup

### v0.0.22

- Add quickfixes for:
  - implementing interfaces in response to `solidity error 3656`
  - constraining mutability (adding the view/pure keyword) in response to `solidity warning 2018`
  - specifying the visibility in response to `solidity error 4937`
  - adding virtual keyword in response to `solidity error 4334`
  - adding override keyword in response to `solidity error 9456` or `solidity error 4327`
- bug fix for compiler warnings/errors not appearing
- bump minimum version of vscode to 1.63 and depend on node 14

### v0.0.21

- Fix the implementation of go to definition for constructors
- Update bundled version of prettier

### v0.0.19 & v0.0.20

- Improve external dependency resolution for Daptools
- Added warning about potential conflicts with other .sol extension

### v0.0.18

- Implemented external dependency resolution for Daptools
- Implemented external dependency resolution for Brownie

### v0.0.17

- Added this welcome message

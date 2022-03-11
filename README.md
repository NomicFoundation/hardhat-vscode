# The Hardhat VSCode private beta has finished

> This extension was used as a private beta for Hardhat VSCode, please use the [public version of the extension](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity)

This extension will receive no further releases, and will be archived in the near future.

## Changelog

### v0.0.25

- add warning message that private beta has finished and to switch to the public beta

### v0.0.24

- Expose the telemetry enable/disable switch in the extension settings
- Smaller extension install size due to the inclusion of bundling and minification
- Fix for indexing popup not going away when there are no sol files found

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

# @nomicfoundation/coc-solidity

## 0.9.0

### Minor Changes

- 77c18a9: Drop Node 20 support, the extension now requires VS Code 1.101.0.
- 0c2a81b: Prevent language server crash during validation when compiler warning or error lacks sourceLocation information.
- fd132da: Show a hover for declarations. Hovering the name in a declaration - a state or local variable, a function, a parameter, a struct, enum, event, error or contract - previously showed nothing, because hover only resolved references. Constructors now read as `constructor(uint256 amount)` rather than `constructor null(uint256 amount)`, both at the declaration and at a `new Contract()` call site. Thanks @phpmac!
- 0479cd7: Update the bundled list of solc versions through 0.8.36, and stop offering unreleased versions.

### Patch Changes

- a1f4324: Update to the lastest Hardhat 3.
- e9471d4: Update the vscode-languageserver packages to 10.x, and LSP to 3.18.
- 99cb9d3: Update the bundled Solidity formatter to `prettier@2.8.8` and `prettier-plugin-solidity@1.4.3`.
- bed8756: Update Slang to 1.3.8, so that document symbols and semantic highlighting parse Solidity up to 0.8.36.
- a1f4324: Make the "no available solc version" message more legible.

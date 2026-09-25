# Hardhat 2 example workspace

A cut-down [hardhat3](../hardhat3/README.md) on Hardhat 2, for the language server harness. It keeps
the contracts that exercise cross-file and library imports, hover, rename, signature help, quick
fixes and a bad import:

- `Greeter.sol` and `access/`, an import across directories plus `hardhat/console.sol` and
  OpenZeppelin;
- `CodeCoin.sol`, the Implement Interface quick fix against OpenZeppelin's `IERC20`;
- `Rename.sol`, `SignatureHelp.sol`, `Quickfix.sol` and `hover/`;
- `imports/404-non-existant.sol`, with its bad import commented out as upstream.

It differs from hardhat3 in the ways Hardhat 2 needs: a CommonJS `hardhat.config.js`, one solc
version (0.8.30), `@nomicfoundation/hardhat-ethers` instead of the toolbox, and a single mocha test
in JavaScript using chai 4.

`pnpm-workspace.yaml` is what keeps this a standalone project. Without it, pnpm treats the
directory as part of the hardhat-vscode workspace and installs the repository root instead.

Build and test with `pnpm hardhat compile` and `pnpm hardhat test`.

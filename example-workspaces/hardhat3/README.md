# Hardhat for Visual Studio Code Smoke Tests

> Copied from [NomicFoundation/smoke-tests-vscode](https://github.com/NomicFoundation/smoke-tests-vscode)
> at `134dc003ba8257a1ae64e55547328e96c09fac84` (2026-09-16), as the primary example workspace for
> the language server harness. Changes from upstream:
>
> - dropped `.devcontainer`, eslint, solhint, dotenv and the `.env.example`;
> - dropped the `sepolia` network and the `verify` config, which needed `configVariable`s;
> - dropped `evmVersion: "amsterdam"` from the 0.8.37 compiler. solc 0.8.37 rejects it unless
>   experimental mode is enabled, and every contract resolves to 0.8.37, so it broke the build;
> - pinned `packageManager` and regenerated `pnpm-lock.yaml`.

Release prep for *Hardhat for Visual Studio Code* involves running through manual tests from this repo on multiple os. This is to support our integration tests and provide a final sanity check that core functionality is working on different platforms.

*Hardhat for Visual Studio Code* is tested against:

- Mac OS X
- Windows
- Remote containers with docker as the backing

## Manual Test Run

This project uses **Hardhat 3**, which requires Node.js v22.13.0 or later.

Install the Release Candidate vsix file into your local instance of vscode on one of the test platforms (i.e. windows). Open this repo within vscode and install the dependencies:

```shell
pnpm install
```

Confirm that the contracts build cleanly at the command line:

```shell
pnpm hardhat compile
```

Confirm that the TypeScript tests still pass:

```shell
pnpm hardhat test
```

Any new features or bugs that constitute the release should be checked.

To sanity check core functionality:

- function signature quickfixes: open [Quickfix.sol](./contracts/Quickfix.sol), and remove the function signature keyword until you have tested:
    * Constrain mutability by adding view/pure to function signature
    * Meet inheritance requirements by adding virtual/override on function signature
    * Provide accessibility by adding public/private to function signature
- Implement interface quickfix: open [CodeCoin.sol](./contracts/CodeCoin.sol), delete the contract and import statement:
    * add back the openzepplin IERC20 import checking code completion
    * add `contract CodeCoin is IERC20 {}` to the body and confirm the `implement interface` quickfix is working
- Single file rename: open [Rename](./contracts/Rename.sol), rename the `complete` signature and confirm all usages are updated
- Multi file rename: confirm `pnpm hardhat compile`, open [Greeter.sol](./contracts/Greeter.sol), rename the `Auth` contract, confirm `pnpm hardhat compile` still works
- Imports: check import line errors by opening [404-non-existant.sol](./contracts/imports/404-non-existant.sol) and uncommenting the import line, a 404 error should be reported inline. Add the comment back and check the other imports.
- Confirm that Solidity highlighting works inside of markdown files like so:

```solidity
import "./404-non-existant.sol";

contract Greeter {
    function greet() public pure returns (string memory) {
        return "Hello, World!";
    }
}
```
# Example workspaces

A curated set of Solidity projects for exploring the language server's behaviour, by an agent through the harness in `scripts/harness/` or by a person opening one in VS Code with the locally built extension.

| workspace | framework | what it is for |
| --- | --- | --- |
| [hardhat3](./hardhat3/README.md) | Hardhat 3 | the primary: a copy of `smoke-tests-vscode`, one file per feature |
| [foundry](./foundry/README.md) | Foundry | `forge init` plus a remapped cross-file import |
| [hardhat2](./hardhat2/README.md) | Hardhat 2 | a cut-down hardhat3 on Hardhat 2 |

Each one is a standalone project with its own lockfile, not part of the hardhat-vscode pnpm workspace. A user's project is standalone, and the language server resolves `hardhat` from the project's own `node_modules`, so a shared workspace would test a layout no user has. The Hardhat workspaces each carry a `pnpm-workspace.yaml` for that reason.

Set them up with the harness. It installs each workspace's dependencies (forge-std for Foundry) and builds it once, so the compilers are downloaded before a language server is pointed at it:

```shell
pnpm harness init                       # every workspace
pnpm harness init --workspace hardhat3  # one
```

Each must build and pass its tests as committed: `pnpm hardhat compile && pnpm hardhat test` for the Hardhat workspaces, `forge build && forge test` for Foundry.

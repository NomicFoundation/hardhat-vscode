# Example workspaces

A curated set of Solidity projects for exploring the language server's behaviour, by an agent through the harness in `scripts/harness/` or by a person opening one in VS Code with the locally built extension.

| workspace | framework | what it is for |
| --- | --- | --- |
| [hardhat3](./hardhat3/README.md) | Hardhat 3 | the main example project, often used for smoke testing |
| [foundry](./foundry/README.md) | Foundry | `forge init` plus a remapped cross-file import |
| [hardhat2](./hardhat2/README.md) | Hardhat 2 | a cut-down hardhat3 on Hardhat 2 |

Each one is a standalone project with its own lockfile, not part of the hardhat-vscode pnpm workspace.

Set them up by hand until the harness's `init` exists:

```shell
(cd example-workspaces/hardhat3 && pnpm install)
(cd example-workspaces/hardhat2 && pnpm install)
(cd example-workspaces/foundry && forge install --no-git foundry-rs/forge-std@v1.16.2)
```

Each must build and pass its tests as committed: `pnpm hardhat compile && pnpm hardhat test` for the Hardhat workspaces, `forge build && forge test` for Foundry.

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

Start a language server against one, which also makes it the current workspace. Only one runs at a time; starting another replaces it:

```shell
pnpm harness start --workspace hardhat3               # foreground, until Ctrl+C
pnpm harness start --workspace hardhat3 --background  # detach, once it is ready
pnpm harness status                                   # exits 0 only when ready
pnpm harness stop
```

`start` returns, or reports `ready` in the foreground, once the server has indexed the workspace and validated one file in each project, so the first request made afterwards gets a full answer. It runs the tsc build at `server/out/index.js`, so run `pnpm build` first. State lives in `.harness/` at the repository root, including `daemon.log` in background mode.

Each must build and pass its tests as committed. After editing the current workspace (the one recorded in `.harness/workspace`), check it and put it back:

```shell
pnpm harness validate                    # build it and run its tests
pnpm harness reset                       # discard edits; installs and build output are kept
pnpm harness reset --workspace foundry   # a workspace other than the current one
```

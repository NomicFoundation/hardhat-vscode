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

## Exploring in VS Code

Open this checkout in VS Code, select the **Launch Client in Example Workspace** launch configuration in the Run and Debug view, and pick a workspace. A new window opens on that workspace, running the extension and the language server from this checkout, with `pnpm watch` rebuilding both as you edit. Reload the new window (**Developer: Reload Window**) to pick up a rebuild.

- **Run Without Debugging** (Ctrl+F5) works anywhere, including in a devcontainer.
- **Start Debugging** (F5), or the **Client + Server in Example Workspace** compound, attaches the debugger as well, so breakpoints in `client/src` and `server/src` are hit in the window you launched from. In a devcontainer, that attach can fail. The new window then opens, but no extension in it ever runs, because VS Code starts its extension host paused until the debugger attaches. If that happens, close the window and use Run Without Debugging.

Run `pnpm harness init --workspace <name>` once first, so the workspace has its dependencies. The launch sets `VSCODE_NODE_ENV=development`, so the server runs in test mode, as it does under the harness (see below). It reads no `.env`, so the telemetry keys are empty and nothing is sent to Sentry or Google Analytics. Hardhat's worker processes run as children of the server, and the debugger is not attached to them.

## Driving the language server from the command line

Start a language server against one, which also makes it the current workspace. Only one runs at a time; starting another replaces it:

```shell
pnpm harness start --workspace hardhat3               # foreground, until Ctrl+C
pnpm harness start --workspace hardhat3 --background  # detach, once it is ready
pnpm harness status                                   # exits 0 only when ready
pnpm harness stop
```

`start` returns, or reports `ready` in the foreground, once the server has indexed the workspace and validated one file in each project, so the first request made afterwards gets a full answer. It runs the tsc build at `server/out/index.js`, so run `pnpm build` first. State lives in `.harness/` at the repository root, including `daemon.log` in background mode.

Talk to the running server with `lsp-message`. It sends exactly what you ask for and nothing else, and prints the server's answer as JSON:

```shell
# Build a request. --line and --character count from 1, as in an editor;
# the positions the server returns are printed as sent, counting from 0.
pnpm harness lsp-message --method textDocument/definition --file contracts/Greeter.sol --line 9 --character 5

# After editing a file on disk, bring the server's copy up to date (only
# didOpen or a full-text didChange is sent) and wait for it to be validated.
pnpm harness lsp-message --sync-from-disk --file contracts/Greeter.sol --wait-for custom/validated
pnpm harness diagnostics --file contracts/Greeter.sol

# Pass a JSON-RPC message through as given: a request if it has an "id".
pnpm harness lsp-message --message '{"id": 1, "method": "textDocument/hover", "params": {...}}'

# Everything the server has sent, numbered; pass "latest" as the next --since.
pnpm harness notifications --since 0 --method custom/validated
```

The server runs in test mode (`VSCODE_NODE_ENV=development`), as in the protocol suite. That is what makes it send `custom/validated`, which readiness and `--wait-for` rely on. It also removes the typing debounce and uses the built-in list of solc versions, so its timing is not quite what a user sees.

Each must build and pass its tests as committed. After editing the current workspace (the one recorded in `.harness/workspace`), check it and put it back:

```shell
pnpm harness validate                    # build it and run its tests
pnpm harness reset                       # discard edits; installs and build output are kept
pnpm harness reset --workspace foundry   # a workspace other than the current one
```

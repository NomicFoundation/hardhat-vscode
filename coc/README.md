# coc-solidity

> WARNING: This coc extension is alpha software and as such is highly experimental and under active development. It is being released under Nomic Foundation's `@ignored` namespace on npm but will migrate to the `@nomicfoundation` namespace once it has moved out of alpha.

Solidity language server extension for coc.nvim, leveraging the language server used in the [Solidity by Nomic Foundation](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity) VS Code extension.

Built by the [Nomic Foundation](https://nomic.foundation/) for the Ethereum community.

Join our [Hardhat Support Discord server](https://hardhat.org/discord) to stay up to date on new releases, plugins and tutorials.

## Install

In your vim/neovim, run this command:

```sh
:CocInstall @ignored/coc-solidity
```

## Features

- Code completion
- Go to definition, type definition and references
- Symbol renames
- Inline validation for Hardhat projects
- Hover help for variables, function calls, errors, events etc.
- Code actions (quickfixes) suggested from compiler errors/warnings
  - Implement missing functions on interface with stubs
  - Constrain mutability by adding `view`/`pure` to function signature
  - Meet inheritance requirements by adding `virtual`/`override` on function signature
  - Provide accessibility by adding `public`/`private` to function signature

## Language server logs

If you encounter an issue with the plugin, you can inspect the server logs by running `:CocCommand workspace.showOutput`. This can help troubleshooting the problem.

## Restarting the server

Sometimes, e.g. when installing node dependencies or switching branches, the language server may not pick up all the file system changes. If you are facing an issue, try running `:CocRestart`, which will in turn restart the solidity language server.

## Contributing

Contributions are always welcome! Feel free to [open any issue](https://github.com/NomicFoundation/hardhat-vscode/issues) or send a pull request.

Go to [CONTRIBUTING.md](https://github.com/nomicfoundation/hardhat-vscode/blob/main/CONTRIBUTING.md) to learn about how to set up a development environment.

## Feedback, help and news

[Hardhat Support Discord server](https://hardhat.org/discord): for questions and feedback.

[Follow Hardhat on Twitter.](https://twitter.com/HardhatHQ)

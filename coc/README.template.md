# coc-solidity

Solidity language server extension for coc.nvim, leveraging the language server used in the [Solidity by Nomic Foundation](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity) VS Code extension.

Built by the [Nomic Foundation](https://nomic.foundation/) for the Ethereum community.

Join our [Hardhat Support Discord server](https://hardhat.org/discord) to stay up to date on new releases, plugins and tutorials.

## Install

In your vim/neovim, run this command:

```sh
:CocInstall @nomicfoundation/coc-solidity
```

## Configure

In your coc-settings.json, the following settings are supported:

- `"@ignored/coc-solidity.telemetry": true|false`
- `"@ignored/coc-solidity.formatter": "prettier"|"forge"|"none"`

[include '../docs/features.md']

## Format document

Running `:call CocActionAsync('format')` will trigger document formatting.

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

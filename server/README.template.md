# Solidity Language Server

A language server for the [Solidity](https://soliditylang.org/) programming language, used in the `Solidity by Nomic Foundation` VS code extension and the `@nomicfoundation/coc-solidity` coc.nvim extension.

Built by the [Nomic Foundation](https://nomic.foundation/) for the Ethereum community.

Join our [Hardhat Support Discord server](https://hardhat.org/discord) to stay up to date on new releases, plugins and tutorials.

## Install

The language server can be installed via npm:

```sh
npm install @nomicfoundation/solidity-language-server -g

```

To run the server standalone:

```sh
nomicfoundation-solidity-language-server --stdio
```

### coc.nvim

For coc the extension for this language server (found [here](https://www.npmjs.com/package/@nomicfoundation/coc-solidity)) can be installed through the coc vim command:

```vim
:CocInstall @nomicfoundation/coc-solidity
```

### neovim lsp

To run the language server directly through the neovim lsp (assuming [neovim/nvim-lspconfig](https://github.com/neovim/nvim-lspconfig))

```sh
local lspconfig = require 'lspconfig'
local configs = require 'lspconfig.configs'

configs.solidity = {
  default_config = {
    cmd = {'nomicfoundation-solidity-language-server', '--stdio'},
    filetypes = { 'solidity' },
    root_dir = lspconfig.util.find_git_ancestor,
    single_file_support = true,
  },
}

lspconfig.solidity.setup {}
```

[include '../docs/features.md']

## Contributing

Contributions are always welcome! Feel free to [open any issue](https://github.com/NomicFoundation/hardhat-vscode/issues) or send a pull request.

Go to [CONTRIBUTING.md](https://github.com/nomicfoundation/hardhat-vscode/blob/main/CONTRIBUTING.md) to learn about how to set up a development environment.

## Feedback, help and news

[Hardhat Support Discord server](https://hardhat.org/discord): for questions and feedback.

[Follow Hardhat on Twitter.](https://x.com/HardhatHQ)

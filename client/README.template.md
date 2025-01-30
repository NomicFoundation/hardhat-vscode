# Solidity by Nomic Foundation

This extension adds language support for [Solidity](https://soliditylang.org/) to Visual Studio Code, and provides editor integration for [Hardhat](https://hardhat.org/) projects, and experimental support for [Foundry](https://getfoundry.sh/), [Truffle](https://trufflesuite.com/) and [Ape](https://www.apeworx.io/) projects. It supports:

- [Code completion](#code-completions)
- [Go to definition, type definition and references](#navigation)
- [Symbol renames](#renames)
- [Solidity code formatting](#format-document)
- [Inline code validation from compiler errors/warnings for Hardhat projects](#inline-code-validation-diagnostics)
- [Hover help for variables, function calls, errors, events etc.](#hover)
- [Code actions (quickfixes) suggested from compiler errors/warnings for Hardhat projects](#code-actions)
  - [Implement missing functions on interface with stubs](#implement-missing-functions-on-interface)
  - [Constrain mutability by adding `view`/`pure` to function signature](#constrain-mutability)
  - [Meet inheritance requirements by adding `virtual`/`override` on function signature](#adding-virtualoverride-on-inherited-function-signature)
  - [Provide accessibility by adding `public`/`private` to function signature](#adding-publicprivate-to-function-signature)
  - [Specify license identifier and pragma solidity version](#adding-license-identifier-and-pragma-solidity-version)

Built by the [Nomic Foundation](https://nomic.foundation/). [We’re hiring](https://nomic.foundation/hiring).

---

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Project support](#project-support)
  - [Hardhat](#hardhat)
  - [Foundry](#foundry-experimental)
  - [Truffle](#truffle-experimental)
  - [Ape](#ape-experimental)
- [Monorepo Support](#monorepo-support)
- [Formatting](#formatting)
  - [Formatting Configuration](#formatting-configuration)
- [Feedback, help and news](#feedback-help-and-news)

---

## Installation

**Solidity by Nomic Foundation** can be installed by [using the Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity).

Some features (e.g. inline validation, quick fixes) are still experimental and are only enabled within a [Hardhat](https://hardhat.org/) project, this is a limitation that will be lifted with future releases.

[include '../docs/features.md']

### Commands

#### Compile project

When working on a Hardhat project, the command `Hardhat: Compile project` is available on the command palette. This will trigger a `hardhat compile` run.

![Compile command](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/command-compile.gif "Compile command")

#### Clean artifacts

When working on a hardhat project, the command `Hardhat: Clear cache and artifacts` is present on the command palette. This will trigger a `hardhat clean` run.

![Clean command](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/command-clean.gif "Clean command")

#### Flatten contract

When working on a solidity file inside a hardhat project, the command `Hardhat: Flatten this file and its dependencies` is present on the command palette and the context menu. This will trigger a `hardhat flatten $FILE` run, and will output the result in a new file tab.

![Flatten command](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/command-flatten.gif "Flatten command")

### Task provider

The extension is registered as a task provider for Hardhat projects, in which the `build` task is provided, running `hardhat compile`, and the `test` task, which runs `hardhat test`.

## Formatting

**Solidity by Nomic Foundation** provides formatting support for `.sol` files, by leveraging [prettier-plugin-solidity](https://github.com/prettier-solidity/prettier-plugin-solidity).

> **Note:** if you currently have other solidity extensions installed, or have had previously, they may be set as your default formatter for solidity files.

To set **Solidity by Nomic Foundation** as your default formatter for solidity files:

1. Within a Solidity file run the _Format Document With_ command, either through the **command palette**, or by right clicking and selecting through the context menu:

![Format Document With](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/images/format_document_with.png "Format Document With")

2. Select `Configure Default Formatter...`

![Format Document With](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/images/configure_default_formatter.png "Configure default formatter")

3. Select `Solidity` as the default formatter for solidity files

![Format Document With](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/images/select_solidity_plus_hardhat.png "Configure default formatter")

### Formatting Configuration

Formatting can be configured to be provided by either `prettier` (the default) or `forge`.

#### Prettier

The default formatting rules that will be applied are taken from [prettier-plugin-solidity](https://github.com/prettier-solidity/prettier-plugin-solidity#configuration-file), with the exception that `explicitTypes` are preserved (rather than forced).

To override the settings, add a `prettierrc` configuration file at the root of your project. Add a `*.sol` file override to the prettier configuration file and change from the **defaults** shown:

```javascript
// .prettierrc.json
{
  "overrides": [
    {
      "files": "*.sol",
      "options": {
        "printWidth": 80,
        "tabWidth": 4,
        "useTabs": false,
        "singleQuote": false,
        "bracketSpacing": false,
        "explicitTypes": "preserve"
      }
    }
  ]
}
```

#### Forge

If `forge` is selected as the formatter under the configuration, then the `forge fmt` command is run on the open editor file to provide formatting. The `forge fmt` command determines the configuration based on the project's `foundry.toml` file.

The configuration options for `forge fmt` are [available here](https://book.getfoundry.sh/reference/config/formatter).

## Alternative editors

We currently distribute a [vim.coc](https://www.npmjs.com/package/@nomicfoundation/coc-solidity) extension and a [standalone language server](https://www.npmjs.com/package/@nomicfoundation/solidity-language-server) that you can integrate with your editor of choice to have full Solidity language support.

## Feedback, help and news

[Hardhat Support Discord server](https://hardhat.org/discord): for questions and feedback.

[Follow Hardhat on Twitter.](https://twitter.com/HardhatHQ)

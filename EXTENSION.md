# Solidity by Nomic Foundation

This extension adds language support for [Solidity](https://soliditylang.org/) to Visual Studio Code, and provides editor integration for [Hardhat projects](https://hardhat.org/). Integrations for other tools are coming in the near future. It supports:

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
- [Setup](#setup)
- [Hardhat Projects](#hardhat-projects)
  - [Monorepo Support](#monorepo-support)
- [Formatting](#formatting)
  - [Formatting Configuration](#formatting-configuration)
- [Feedback, help and news](#feedback-help-and-news)

---

## Installation

**Solidity by Nomic Foundation** can be installed by [using the Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity).

Some features (e.g. inline validation, quick fixes) are still experimental and are only enabled within a [Hardhat](https://hardhat.org/) project, this is a limitation that will be lifted with future releases.

## Features

### Code Completions

**Solidity by Nomic Foundation** autocompletes references to existing symbols (e.g. contract instances, globally available variables and built-in types like arrays) and import directives (i.e. it autocompletes the path to the imported file).

Direct imports (those not starting with `./` or `../`) are completed based on suggestions from `./node_modules`.

Relative imports pull their suggestions from the file system based on the current solidity file's location.

![Import completions](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/import-completion.gif "Import completions")

---

### Navigation

Move through your codebase with semantic navigation commands:

#### Go to Definition

Navigates to the definition of an identifier.

#### Go to Type Definition

Navigates to the type of an identifier.

#### Go to References

Shows all references of the identifier under the cursor.

![Navigation](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/navigation.gif "Navigation")

---

### Renames

Rename the identifier under the cursor and all of its references:

![Rename](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/rename.gif "Rename")

---

### Format document

Apply solidity formatting to the current document.

The formatting configuration can be overriden through a `.prettierrc` file, see [Formatting Configuration](#formatting-configuration).

![Reformat](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/format.gif "Reformat")

---

### Hover

Hovering the cursor over variables, function calls, errors and events will display a popup showing type and signature information:

![Hover](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/on-hover.gif "Hover")

---

### Inline code validation (Diagnostics)

As code is edited, **Solidity by Nomic Foundation** runs the [solc](https://docs.soliditylang.org/en/latest/using-the-compiler.html) compiler over the changes and displays any warnings or errors it finds.

This feature is only available in solidity files that are part of a **Hardhat** project, as **Hardhat** is used for import resolution, see [Hardhat Projects](#hardhat-projects) for details.

![Diagnostic](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/diagnostic.gif "Diagnostic")

---

### Code Actions

Code actions, or quickfixes are refactorings suggested to resolve a [solc](https://docs.soliditylang.org/en/latest/using-the-compiler.html) warning or error.

A line with a warning/error that has a _code action_, will appear with small light bulb against it; clicking the light bulb will provide the option to trigger the _code action_.

#### Implement missing functions on interface

A contract that implements an interface, but is missing functions specified in the interface, will get a `solidity(3656)` error.

The matching code action _Add missing functions from interface_ will determine which functions need to be implemented to satisfy the interface and add them as stubs to the body of the contract.

![Implement interface](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/implement-interface.gif "Implement interface")

#### Constrain mutability

A function without a mutability keyword but which does not update contract state will show a `solidity(2018)` warning, with `solc` suggesting adding either the `view` or `pure` keyword depending on whether the function reads from state.

The matching code action _Add view/pure modifier to function declaration_ resolves the warning by adding the keyword to the function signature.

![Constrain Mutability](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/constrain-mutability.gif "Constrain Mutability")

#### Adding `virtual`/`override` on inherited function signature

A function in an inheriting contract, that has the same name and parameters as a function in the base contract, causes `solidity(4334)` in the base contract function if it does not have the `virtual` keyword and `solidity(9456)` in the inheriting contract function if does not have the `override` keyword.

The _Add virtual specifier to function definition_ and _Add override specifier to function definition_ code actions appear against functions with these errors.

![Virtual and Override](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/virtual-override.gif "Virtual and Override")

#### Adding `public`/`private` to function signature

A function without an accessibility keyword will cause the `solidity(4937)` error.

Two code actions will appear against a function with this error: _Add public visibility to declaration_ and _Add private visibility to declaration_.

![Public Private](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/public-private.gif "Public Private")

#### Adding license identifier and `pragma solidity` version

When no license is specified on a contract, the `solidity(1878)` warning is raised by the compiler. Similarly, when no compiler version is specified with a `pragma solidity` statement, the compiler shows the `solidity(3420)` warning. There are code actions available for quick fixes.

![Add license specifier](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/add-license.gif "Add license specifier")

![Add pragma solidity](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/add-pragma.gif "Add pragma solidity")

#### Specifying data location for variables

Some types require you to specify a data location (memory, storage, calldata), depending on where they are defined. The available code actions allow the user to add, change or remove data locations depending on the error being raised.

![Data location quickfix](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/data-location.gif "Specify data location")

### Commands

#### Compile project

When working on a hardhat project, the command `Hardhat: Compile project` is available on the command palette. This will trigger a `hardhat compile` run.

![Compile command](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/command-compile.gif "Compile command")

#### Clean artifacts

When working on a hardhat project, the command `Hardhat: Clear cache and artifacts` is present on the command palette. This will trigger a `hardhat clean` run.

![Clean command](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/command-clean.gif "Clean command")

#### Flatten contract

When working on a solidity file inside a hardhat project, the command `Hardhat: Flatten this file and its dependencies` is present on the command palette and the context menu. This will trigger a `hardhat flatten $FILE` run, and will output the result in a new file tab.

![Flatten command](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/command-flatten.gif "Flatten command")

### Task provider

The extension is registered as a task provider for hardhat projects, in which the `build` task is provided , running `hardhat compile`, and the `test` task, which runs `hardhat test`.

---

## Setup

This extension should work without any configuration. If formatting functionality isn't working, or you have previously configured another **Solidity** formatter, please see the [formatting section](#formatting).

## Hardhat Projects

**Solidity by Nomic Foundation** provides enhanced functionality for Solidity files within a **Hardhat** project, including inline validation and quick fixes.

To take advantage of these features, use the `File` menu to `Open Folder`, and select the folder containing the `hardhat.config.{js,ts}` file.

Inline validation (the display of compiler errors and warnings against the code) is based on your Hardhat configuration file. The version of the `solc` solidity compiler used for validation is set within this file, see the [Hardhat documentation](https://hardhat.org/config/#solidity-configuration) for more details.

### Monorepo Support

**Solidity by Nomic Foundation** will detect Hardhat projects (folders containing a `hardhat.config.{js,ts}` file) within a monorepo, when the root of the monorepo is opened as a workspace folder.

The **Hardhat config file** that is used when validating a Solidity file is shown in the Solidity section on the _Status Bar_:

![Open Config](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/open-config.gif "Open Config")

## Formatting

**Solidity by Nomic Foundation** provides formatting support for `.sol` files, by leveraging [prettier-plugin-solidity](https://github.com/prettier-solidity/prettier-plugin-solidity).

> **Note:** if you currently have other solidity extensions installed, or have had previously, they may be set as your default formatter for solidity files.

To set **Solidity by Nomic Foundation** as your default formatter for solidity files:

1. Within a Solidity file run the _Format Document With_ command, either through the **command palette**, or by right clicking and selecting through the context menu:

![Format Document With](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/images/format_document_with.png "Format Document With")

2. Select `Configure Default Formatter...`

![Format Document With](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/images/configure_default_formatter.png "Configure default formatter")

3. Select `Solidity` as the default formatter for solidity files

![Format Document With](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/images/select_solidity_plus_hardhat.png "Confiure default formatter")

### Formatting Configuration

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

## Feedback, help and news

[Hardhat Support Discord server](https://hardhat.org/discord): for questions and feedback.

[Follow Hardhat on Twitter.](https://twitter.com/HardhatHQ)

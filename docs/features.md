## Features

### Code Completions

The solidity language server autocompletes references to existing symbols (e.g. contract instances, globally available variables and built-in types like arrays) and import directives (i.e. it autocompletes the path to the imported file).

Direct imports (those not starting with `./` or `../`) are completed based on suggestions from `./node_modules`.

Relative imports pull their suggestions from the file system based on the current solidity file's location.

![Import completions](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/import-completion.gif "Import completions")

Natspec documentation completion is also supported

![Natspec contract completions](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/natspec-contract.gif "Natspec contract completion")

![Natspec function completions](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/natspec-function.gif "Natspec function completion")

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

The formatting configuration can be overridden through a `.prettierrc` file, see [Formatting Configuration](#formatting-configuration).

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

#### Fix addresses checksum

The solidity compiler requires explicit addresses to be in the correct checksummed format. This quickfix transforms any address to the expected format.

![Address checksum](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/checksum-address.gif "Fix address checksum")

#### Hardhat console auto-import

Hardhat's `console.sol` can be imported with this quickfix. Please note that this is only available on hardhat projects.

![Console import](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/import-console.gif "Import console")

---

## Hardhat Projects

**Solidity by Nomic Foundation** provides enhanced functionality for Solidity files within a **Hardhat** project, including inline validation and quick fixes.

To take advantage of these features, use the `File` menu to `Open Folder`, and select the folder containing the `hardhat.config.{js,ts}` file.

Inline validation (the display of compiler errors and warnings against the code) is based on your Hardhat configuration file. The version of the `solc` solidity compiler used for validation is set within this file, see the [Hardhat documentation](https://hardhat.org/config/#solidity-configuration) for more details.

### Monorepo Support

**Solidity by Nomic Foundation** will detect Hardhat projects (folders containing a `hardhat.config.{js,ts}` file) within a monorepo, when the root of the monorepo is opened as a workspace folder.

The **Hardhat config file** that is used when validating a Solidity file is shown in the Solidity section on the _Status Bar_:

![Open Config](https://raw.githubusercontent.com/NomicFoundation/hardhat-vscode/main/docs/gifs/open-config.gif "Open Config")

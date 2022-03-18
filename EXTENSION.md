# Hardhat for Visual Studio Code

This extension adds language support for [Solidity](https://soliditylang.org/) to Visual Studio Code, and provides editor integration for [Hardhat projects](https://hardhat.org/). Integrations for other tools are coming in the near future. It supports:

- Code completion
- Go to definition, type definition and references
- Symbol renames
- Solidity code formatting through [prettier-plugin-solidity](https://github.com/prettier-solidity/prettier-plugin-solidity)
- Inline code validation from compiler errors/warnings for Hardhat projects
- Hover help for variables, function calls, errors, events etc.
- Code actions (quickfixes) suggested from compiler errors/warnings for Hardhat projects
  - Implement missing functions on interface with stubs
  - Constrain mutability by adding `view`/`pure` to function signature
  - Meet inheritance requirements by adding `virtual`/`override` on function signature
  - Provide accessibility by adding `public`/`private` to function signature

Built by the [Nomic Foundation](https://nomic.foundation/). [We’re hiring](https://nomic.foundation/hiring).

## Installation

**Hardhat for Visual Studio Code** can be installed by [using the Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity).

Some features (e.g. inline validation) are still experimental and are only enabled within a [Hardhat](https://hardhat.org/) project, this is a limitation that will be lifted with future releases.

## Feedback, help and news

[Hardhat Support Discord server](https://hardhat.org/discord): for questions and feedback.

[Follow Hardhat on Twitter.](https://twitter.com/HardhatHQ)

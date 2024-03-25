# How to contribute to Solidity for Visual Studio Code by Nomic Foundation

This document contains details on how to collaborate and develop on the **Solidity for VS Code by Nomic Foundation** project.

- [How to contribute to Solidity for Visual Studio Code by Nomic Foundation](#how-to-contribute-to-solidity-for-visual-studio-code-by-nomic-foundation)
  - [Project structure](#project-structure)
  - [Installing](#installing)
  - [Running Locally](#running-locally)
    - [1. Ensure you have a working build](#1-ensure-you-have-a-working-build)
    - [2. Open the repo in **vscode**](#2-open-the-repo-in-vscode)
    - [3. Run the extension in development](#3-run-the-extension-in-development)
    - [4. Debug](#4-debug)
  - [Testing](#testing)
    - [Unit](#unit)
    - [Protocol](#protocol)
    - [E2E](#e2e)
  - [Code Formatting](#code-formatting)
  - [Linting](#linting)
  - [Changeset](#changeset)
  - [Packaging](#packaging)
    - [Extension README](#extension-readme)
  - [Publishing](#publishing)

## Project structure

The vscode extension and language server are written in TypeScript. The code is organised into:

- `./client` - the vscode extension, which mainly delegates onto the language server for functionality
- `./server` - the Hardhat language server, which supports the validation, quickfixes and other solidity language features of the extension
- `./test/e2e` - e2e tests that combine both client and server
- `./snippets` - the code snippets the extension contributes on install
- `./syntaxes` - the solidity syntax highlighting rules

## Installing

[node](https://nodejs.org/en/) is required for development.

The repo is organised as a monorepo using `npm`. To install the dependencies of all packages in the repo, run `npm install` in the root directory of the repository. This will install node dependencies at the top level, which are shared among all of the packages.

## Running Locally

### 1. Ensure you have a working build

From the root directory run a build:

```shell
npm install && npm run build
```

If you intend to develop against our analytics you should setup a `.env` file in the root of the repository:

```shell
cp env.example .env
```

The analytics secrets will need then to be populated.

### 2. Open the repo in **vscode**

VSCode is assumed as the development environment as it has inbuilt support for developing VSCode extesions. To open the repository in VSCode from the command line run:

```shell
code .
```

VSCode will suggest plugins that will help develop against the codebase in compliance with the styling and linting rules (see [extensions.json](./.vscode/extensions.json) for the list).

### 3. Run the extension in development

Within VSCode open the Run view (`Ctrl+Shift+D`), select `Launch Client`, and click the Play button (`F5`).

![image](docs/images/run_launch_client.png?raw=true)

This will open a new VS Code window with the title `[Extension Development Host]`. You can then open a folder that contains Solidity code and try out your changes.

You can also set breakpoints to debug your change.

If you make subsequent edits in the codebase, you can reload (`Ctrl+R`) the `[Extension Development Host]` instance of VS Code, which will load the new code.

### 4. Debug

Debugging the client code is as easy as debugging a normal extension. Set a breakpoint in the client code and debug the extension by running `Launch Client`.

Since the server is started by the `LanguageClient` running in the extension (client), we need to attach a debugger to the running server.

To do this, you need:

1. Go to the Run view and choose the `Attach to Server` configuration. \
   ![image](docs/images/run_attach_to_server.png?raw=true)
2. Add breakpoints as needed.
3. Before starting the `Attach to Server` configuration make sure that `Launch Client` is already started.
4. Start debugging (`F5`) or play button.
5. This will attach the debugger to the server and the breakpoints will be applied to them.

**Note**: Breakpoints need to be in the server directory because we attach to the server and only server breakpoints will be visible for us.

## Testing

The project has unit, protocol and e2e tests. Components of the server should be tested with unit tests, with a small set of integration tests providing confidence that component interactions work.

A complete test run involves both test suites and can be run, from repo root, with:

```shell
npm test
```

### Unit

A **mocha** unit/component test suite covers the `./server`. The tests are kept separate from the src files in [./server/test](./server/test/). The tests can be run from the repo root with:

```shell
npm run test:unit
```

Or within the `./server` folder with:

```shell
npm test
```

Code coverage is available with:

```shell
npm run test:coverage
```

### Protocol

Protocol tests boot up only the LSP and interact with it using a custom test language client.

To run the protocol tests from the command line, in the repo root run:

```shell
npm run test:protocol
```

### End-to-End (E2E)

End to end tests that run a VSCode instance and exercise its workspace, files, Hardhat Client / Server, and VS Code commands. The integration tests are run using **mocha** and are contained in the [./test/e2e](./test/e2e) folder.

To run the End-to-End tests from the command line, in the repo root run:

```shell
npm run test:e2e
```

To run the End-to-End tests within VSCode, open the Run view (`Ctrl+Shift+D`), select `Language Server E2E Test`, and click the Play button (`F5`). \
 ![image](docs/images/run_e2e_test.png?raw=true)

## Code Formatting

We use Prettier to format all the code (and supporting json config, markdown files) without any special configuration. Whatever Prettier does is considered The Right Thing. Prettier is run in the CI, so run `npm run lint:fix` before pushing to auto-magically get into compliance.

## Linting

We also have ESLint running on `./server`, `./client` and `./test`. It forbids some dangerous patterns.

The linter is always run in the CI, so make sure it passes before pushing code. You can use `npm run lint` and `npm run lint:fix` both at the root of the repository and within `./server` and `./client`.

## Changeset

We use [changeset](https://github.com/changesets/changesets) to include text that explains to users (via the changelog) what features/fixes/changes have occurred.

Each PR should include a changeset to aid putting together a changelog during release.

To add a changeset to your PR, run:

```shell
npm run changeset add
```

## GIF recording

When adding a new feature or changing an existing one, we encourage the recording of an animated GIF file showing the interaction with said feature. These should be stored in the `docs/gifs` folder and referenced in the corresponding md files (likely `features.md`). We suggest using the tool [peek](https://github.com/phw/peek), with a framerate of 10 fps and no resolution downsampling (value = 1).

## Packaging

VSCode extensions are distributed through a file format called `vsix` (really a zip file with a defined internal struture and metadata files). To build a `vsix` file for local testing or to upload to the [VSCode Marketplace](https://marketplace.visualstudio.com/vscode), run:

```shell
npm run package
```

This will clean the `/out` directories, then create bundled, minified versions of the client, and server files (index.js and helper.js) using [esbuild](https://esbuild.github.io/), and pull them together in the vsix file using `vsce`. The output vsix file will be in the project root.

The `vsix` will contain all files in the repo at the time of packaging, but this is reduced down to only the key files via our [.vscodeignore](./.vscodeignore) file.

### Extension README

The [VSCode Marketplace](https://marketplace.visualstudio.com/vscode) displays the `README.md` file as the landing page for the extension, the same readme is used in the extensions tab.

To separate out the repo readme from the marketing readme, we have two. The repo readme is our actual [README.md](./README.md), while the extension readme is contained in [EXTENSION.md](./EXTENSION.md). During packaging [EXTENSION.md](./EXTENSION.md) is swapped in for [README.md](./README.md). Changes to test displayed on the extensions landing page/extension tab should be made to [EXTENSION.md](./EXTENSION.md).

## Publishing

The extension is published via the [VSCode Marketplace](https://marketplace.visualstudio.com/vscode), see [publish-extension.md](./docs/publish-extension.md) for detailed instructions in making a release.

## Codebase Overview

You can get a better understanding of the codebase from our [overview](./docs/codebase.md).

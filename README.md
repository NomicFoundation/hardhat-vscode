# vscode-solidity

The _vscode-solidity_ extension contains the language smarts behind the solidity editing experience of Visual Studio Code.

### Todo

- _doHover_ provides a hover text for a given location.
- _doCodeActions_ evaluates code actions for the given location, typically to fix a problem.

### Done

- _findDefinition_ finds the definition of the symbol at the given location.
- _findTypeDefinition_ finds the type definition of the symbol at the given location.
- _findReferences_ finds all references to the symbol at the given location.
- _findImplementation_ finds all implementations to the symbol at the given location.
- _doRename_ renames all symbols connected to the given location.
- _doComplete_ provides completion proposals for a given location.
- _doValidation_ analyses an input string and returns syntax and lint errors.

## Developing

### Setup

1. Install [node](https://nodejs.org/en/).
2. Clone the repository, run `yarn && yarn run build`, and open VS Code:

   ```bash
   git clone https://github.com/nomiclabs/hardhat-vscode.git
   cd hardhat-vscode
   yarn && yarn run build
   code .
   ```

VS Code will suggest some plugins that will help develop against the codebase in compliance with the styling and linting rules.

### Run

To run the extension with your patch, open the Run view (`Ctrl+Shift+D`), select `Launch Client`, and click the Play button (`F5`). \
![image](docs/images/run_launch_client.png?raw=true)

This will open a new VS Code window with the title `[Extension Development Host]`. You can then open a folder that contains Solidity code and try out your changes.

You can also set breakpoints to debug your change.

If you make subsequent edits in the codebase, you can reload (`Ctrl+R`) the `[Extension Development Host]` instance of VS Code, which will load the new code.

### Debug

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

## Test

Tests in [testdata](./test/testdata/) directory are End-to-End tests. The benefit of this approach is that it runs the test by instantiating a VS Code instance with a workspace, opening the file, activating the Language Client / Server, and running VS Code commands.

You can run End-to-End tests in two way:

1. Open the Run view (`Ctrl+Shift+D`), select `Language Server E2E Test`, and click the Play button (`F5`). \
   ![image](docs/images/run_e2e_test.png?raw=true)

2. Or run `yarn run test` in command-line.

## Lint

`Prettier` and `eslint` are used to enforce formatting and code rules respectively.

To run the lint check:

```shell
yarn lint
```

Both prettier and eslint can attempt to automatically resolve issues found in the code, to run the fix:

```shell
yarn lint:fix
```

The same command work in both the `./server` and `./client` subfolders.

## Creating the extension package

To build the `vsix` file of the package, run:

```shell
yarn package
```

This will clean the out directories, then create bundled, minified versions of the client, and server files (index.js and helper.js) using [esbuild](https://esbuild.github.io/), and pull them together in the vsix file using `vsce`. The output vsix file will be in the project root.

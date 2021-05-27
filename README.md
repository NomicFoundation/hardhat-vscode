# vscode-solidity-languageservice
The _vscode-solidity-languageservice_ contains the language smarts behind the solidity editing experience of Visual Studio Code.

## Todo
 - *doValidation* analyses an input string and returns syntax and lint errors.
 - *doComplete* provides completion proposals for a given location.
 - *doHover* provides a hover text for a given location.
 - *doCodeActions* evaluates code actions for the given location, typically to fix a problem.

## Done
 - *findDefinition* finds the definition of the symbol at the given location.
 - *findTypeDefinition* finds the type definition of the symbol at the given location.
 - *findReferences* finds all references to the symbol at the given location.
 - *findImplementation* finds all implementations to the symbol at the given location.
 - *doRename* renames all symbols connected to the given location.


## Development
- Clone this repo.
- Run `yarn && yarn run postinstall && yarn run compile` in terminal to build project.
- Run `yarn run client-test` to compile and run tests.

## How can I run the service?
- Open the Debug in VSCode.
- Run the *Launch Client* from the run viewlet and wait until a new VSCode window open.
![image](https://github.com/Tenderly/vscode-solidity/blob/main/docs/images/run_launch_client.png?raw=true)

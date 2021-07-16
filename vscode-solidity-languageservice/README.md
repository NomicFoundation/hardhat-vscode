# vscode-solidity-languageservice
The _vscode-solidity-languageservice_ contains the language smarts behind the solidity editing experience of Visual Studio Code.

### Todo
 - *doValidation* analyses an input string and returns syntax and lint errors.
 - *doHover* provides a hover text for a given location.
 - *doCodeActions* evaluates code actions for the given location, typically to fix a problem.

### Done
 - *findDefinition* finds the definition of the symbol at the given location.
 - *findTypeDefinition* finds the type definition of the symbol at the given location.
 - *findReferences* finds all references to the symbol at the given location.
 - *findImplementation* finds all implementations to the symbol at the given location.
 - *doRename* renames all symbols connected to the given location.
 - *doComplete* provides completion proposals for a given location.

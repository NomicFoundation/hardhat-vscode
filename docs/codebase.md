# Codebase Overview

This document provides an overview of the codebase of the Solidity language server and its client components. This includes both the overall architecture and the details of each component and their processes.

- [Codebase Overview](#codebase-overview)
  - [Understanding the different components](#understanding-the-different-components)
    - [Language server protocol](#language-server-protocol)
      - [Brief description](#brief-description)
      - [How we implement it](#how-we-implement-it)
      - [Full specification](#full-specification)
  - [VSCode Client](#vscode-client)
    - [Task provider](#task-provider)
    - [Syntax highlighting](#syntax-highlighting)
    - [Status items and notifications](#status-items-and-notifications)
  - [coc.nvim client](#cocnvim-client)
  - [Language Server](#language-server)
    - [Analysis](#analysis)
    - [Indexing](#indexing)
    - [Validation](#validation)
    - [Framework abstraction](#framework-abstraction)
    - [Hardhat Support](#hardhat-support)
      - [Validation](#validation-1)
      - [File claiming](#file-claiming)
    - [Foundry Support](#foundry-support)
      - [Validation](#validation-2)
      - [File claiming](#file-claiming-1)
    - [Projectless (no framework)](#projectless-no-framework)
    - [Other features](#other-features)
      - [Quickfixes](#quickfixes)

## Understanding the different components

The codebase has three main node.js packages each of which are published separately:

- Solidity Language server - a published node package and standalone cli application
- VS Code extension client - published to the Microsoft and the OpenVSX registries as a vsix file bundled with the Solidity language server
- coc.nvim extension client - a published node package that can be install by CoC to provide vim support. It depends on the Solidity Language Server as a dependency

Of these components, the one that involves the most complexity and holds most of the data structures and logic, is the Solidity language server. We try to keep the two clients as small wrappers that relay onto the Solidity language server.

Both the VS Code client and the coc.nvim client spawn the language server as a subprocess. But the Solidity language server can also be used independently, for example when using it directly with Neovim.

### Language server protocol

#### Brief description

The Language server protocol describes in a json format all messages sent between a client and language server; where the Language server provides a particular programming language's language features, for example: finding references, completions, quickfixes, diagnostics etc.

This allows multiple text editors to leverage the same language features without having to reimplement the language rules every time. Each editor leverages a different language server for each language, and the language server implementations can be shared across editors.

There are two types of messages that can be exchanged: notifications and requests. A notification doesn't expect a response from the counterpart, and a request does. Some messages are designed to be sent from the client to the server, others are designed to go from server to client.

The low level connection between the two components can be established through different channels: ipc (which we use in vs code and coc), stdio or socket.

The lifecycle begins by the client establishing a connection to the server, and sending an `initialize` request. This specifies what capabilities the client has, and in the response the server specifies what capabilities it supports as well. This serves as a handshake.

After initialization, messages start being exchanged between the components. Some messages are sent implicitly by the editor, for instance file change events (`textDocument/didOpen`, `textDocument/didChange`), and others are originated by explicit action by the user. An example would be requesting the location of the typedefinition for the code under the cursor with a `textDocument/typeDefinition`.

It's useful to get familiar with the data structures that the protocol uses. These involve text document identifiers, positions, ranges, text edits, and many more. A full list can be found [here](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#basicJsonStructures).

It's important to note that on the server side, a list of open documents is updated automatically, based on `textDocument` events, leveraging the `listen` function of `TextDocuments` class.

#### How we implement it

We leverage the [vscode-languageserver-node](https://github.com/microsoft/vscode-languageserver-node) package to implement our modules. Specifically we use the client, server, and protocol subpackages.

Our client module uses the `vscode-languageclient` package, which implements the client-side logic of the protocol specification. It's important to note that this package is only usable through vscode extensions, that is, a module that will be loaded by vscode itself. It's not usable standalone because it depends on modules injected by the VSCode runtime.

Our server module uses the `vscode-languageserver`, `vscode-languageserver-protocol`, `vscode-languageserver-types` and `vscode-languageserver-textdocument` packages.

The use of these modules allows us to only worry about the specifics of our language provider. They provide a set of helpers, types, events and listeners, and abstract away the lower level communication layers (e.g. serialization).

#### Full specification

It's a good idea for the developer to get familiar with the LSP, by reading over its [specification](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/), and keeping it as a reference while working on a specific feature.

## VSCode Client

The VSCode client is the component that VSCode loads to initialize the extension. The entry point is the `extension.ts` file, which exports an `activate()` function.

The most important part of initialization is spawning the language server, which will respond to all the client requests for language features. Some file watchers are setup at this point, so the server is notified whenever some files change on the client side. Additionally, an event listener is set up so configuration changes are notified to the server as well (e.g. telemetry options, default formatter, etc).

### Task provider

Tasks are a VSCode client-side only concept. They are defined and handled by VSCode, and outside the scope of the language server.

We define some basic tasks for Hardhat projects (compile, clean, test), and these can be run through the task-related commands provided by VSCode.

Currently we only provide tasks for Hardhat projects, and have logic in place on the client-side to detect whether active files belong to a Hardhat project or not.

### Syntax highlighting

Under the `syntaxes/solidity.json` file, the syntax for solidity is defined. This is written in textmate grammar format.

### Status items and notifications

Compiler warnings and errors are displayed in VSCode as diagnostics; however, problems in running project initialization or problems in the validation process are displayed through Status Items and Notifications.

If there is a failure during project initialization (e.g. there is a syntax error in the project's Hardhat config file), a VSCode notification is shown to alert the user. The VSCode status bar is also updated using a Language Status item (a small icon on the status bar), to display the error.

The status bar is a VSCode concept and is not part of the Language Server; it is handled by the VSCode client.

## coc.nvim client

CoC is the main vim plugin for interacting with language servers. Our `@nomicfoundation/coc-solidity` extension can be installed via CoC to provide Solidity support.

The client is minimal, a wrapper delegating onto the vscode-languageserver package which allows it to spawn the server and interact with it transparently. The client also syncs configuration and sets up file watchers.

Solidity formatting is available in Vim through the language servers formatting capabilities.

## Language Server

This is by far the most complex component, and includes all the logic for: parsing the language, supporting different solidity frameworks, interacting with solc etc.

Before digging into language features, it's good to get familiar with some core concepts and processes: analysis, indexing, validation, indexing and framework abstraction.

### Analysis

This process consists on parsing a solidity file and its dependencies, and building an Abstract Syntax Tree (AST), a rich graph of symbols, types, expressions that can be used to support navigation and other language features.

The analyzer uses `solidity-parser` to build the ASTs for each source file. It then uses custom logic for enriching those nodes, and interconnecting them forming a graph of the entire projects Solidity code structures.

The resulting graph is used in most language features that require type information and parsing. For example jump to definition, find implementations, function signature etc.

The analysis process is triggered on file change, and during indexing. For optimization purposes, we only analyze local files after indexing (files local to a project, and not libraries, for Hardhat for example, the files under `./contracts` are local but those under `./node_modules/**` are not).

### Indexing

During the initialization phase of the server, we run the indexing process. This involves the following steps:

- Scanning workspace folders for projects: each registered project adapter is called to scan a list of directories and return project instances.
- Initializing projects: each found project is initialized sequentially. Initialization logic is specific to each project adapter.
- Scanning for solidity files: `fast-glob` is used to find all `.sol` files.
- Associating each solidity file to a project: for each found file, each project instance is tested to check whether the file belongs to them or not. Project adapters have priorities to determine which one should be assigned in case multiple of them claim that a file belongs to them. A file will be given the default `projectless` project instance if no other project claims the file.
- Analyzing local source files: from the previous step, some source files are marked as local. This concept means that they are the project's main source files, and not libraries or vendored files. Only local sources are initially analyzed for optimization purposes, since analysis takes up significant amount of time. It's important to note that analysis crawls the files, so libraries are also analyzed if they are imported directly or indirectly from a local source. Non-local files will be analysed as soon as a language server action happens against them.

### Validation

This process involves compiling a given solidity file using solc, and showing any errors/warnings in the form of diagnostics.

There are many parts involved in this process, for example: determining solc version, resolving imports, compiler settings like remappings etc.

Some of these parts are specific to the chosen framework, for example Hardhat supports imports through node modules, and Foundry has automatic remappings for libraries under the lib folder. Since solc doesn't know about this, we have to implement different strategies for each framework. We have a project abstraction in place, which will be described in the next section.

The validation process is triggered when a file is opened or changed. For the given file, we get the associated project and delegate to it for the building of the solc input (mainly the source code, optimization settings, and the source of all imported Solidity files). In response we either construct a valid solc input, or receive framework-level errors. If the input is valid, then solc is invoked and a compiler output is obtained. If there are errors/warnings either from the solc output, or from the input-building step, we generate either diagnostics or status item errors, and send them back to the client using the `textDocument/publishDiagnostics` notification. Since the status item is a VSCode concept, we send a custom notification for it and the client is in charge of displaying it on the window.

If a compilation is successful, all previous diagnostics are cleared.

### Framework abstraction

There are some processes that involve parts of logic that change depending on the framework being used on a project. Examples of this are building a solc input, resolving a given import for navigation, giving custom completions etc.

We try to abstract away as much as possible from the different frameworks, and for that we have put in place an abstract class (`Project`), which is extended by concrete classes that implement the different frameworks.

Source files are associated to projects during the initial indexing phase, and these projects are used for aiding in the main server processes like validation and analysis. For instance, when the analyzer is crawling source files, it needs to resolve imports on the file.

As of now, the responsibilities that are put behind the abstraction are the following:

- Scan directories to find projects (look for `hardhat.config.{js,ts}` for instance)
- Initialize, and perform any setup tasks for the project
- Determine whether a Solidity file belongs to the project
- Resolve the path of a Solidity import statement
- Build a solc compiler input
- React to file watchers (optional)
- Provide custom import completions (optional)
- Provide custom code actions (optional)

### Hardhat Support

#### Validation

Hardhat validation is our most sophisticated framework adapter. It leverages the hardhat library local to a project.

The Hardhat adapter identifies Hardhat project by the presence of `hardhat.config.{ts,js}` files. Each found Hardhat project is then initialized by forking into its own child process. This is necessary because we need to load multiple Hardhat libraries (because we support multiple open projects) as node.js modules. If we were to attempt to load them in the same process, they would be cached and we wouldn't be able to reference the per project HRE object.

This model of forking into child processes adds overhead to communication, since we can't just call javascript functions from the parent process to the child process. We need to leverage a protocol using the IPC transport. Each time we need a service that involves using the HRE, we send a message to the child process and wait for a response.

Once a validation request comes in, the projects send the worker a BuildCompilationRequest. The compilation building happens on the child processes side. It replicates most of Hardhat's `compile` task, including: getting the source paths, getting the source names, building the dependency graph, building a compilation job, and building the compiler input.

Some of these tasks we override for optimization purposes, for example when repeatedly validating a file whose imports didn't change, we avoid rebuilding the dependency graph for it. We also override the `READ_FILE` task from Hardhat to attempt to get the file contents from memory instead of reading them from disk. This is both an optimization and also allows us to use open but unsaved files from the editor.

If at any point Hardhat rejects one of the tasks, we display that result on the client, indicating the source of the error and in some cases providing quickfixes for it.

#### File claiming

A given hardhat project that was successfully initialized will claim ownership over solidity files inside the configured contracts folder and the `node_modules` folder. If the project is unable to initialize (hre can't be loaded), we can't determine which is the contracts folder so we default to claiming all solidity files inside the base folder or any subdirectories.

### Foundry Support

#### Validation

The Foundry projects leverage our implementation for "projectless" solidity files (i.e. files that don't belong to any known framework) with Foundry specific configuration additions.

Building a solc input for validation involves scanning the target file for imports, and then scanning those imported files recursively. When this process finishes, we have a flat list of files to be compiled and a list of pragma statements which we can use to find a suitable version, or verify that the project's specified one matches the criterias. We then read the file contents from memory, using our solidity files index (all files are indexed on server initialization). This makes the compilation building very fast, since we don't read files from disk.

The compilation details from the projectless strategy has the source file keys in absolute path format. This is accepted by solc but we need to transform them to relative paths (from the project root) to get full support from Foundry. So the sources' keys change from e.g. `/path/to/project/src/MyContract.sol` to `src/MyContract.sol` on Foundry projects.

After this transformation, Foundry's remappings are added to the compilation's `input.settings`. These remappings are obtained during the initialization stage, where we invoke `forge` to obtain different configuration values. It's important to note that forge provides the remappings in a recursive manner, so by invoking it on the root project it also gives us the remappings from the imported libraries and their dependencies.

#### File claiming

A given foundry project that was successfully initialized will claim ownership over solidity files inside the configured contracts, lib, test and scripts folders. If the project is unable to initialize (e.g. forge command not found), we can't determine the configured folders so we default to claiming all solidity files inside the base folder or any subdirectories.

### Projectless (no framework)

We provide support to editing standalone solidity files or projects with unknown frameworks. We attempt validation by building the input and invoking the solidity compiler from the language server.

When a file is requested for validation, the first step is crawling all its dependencies recursively through the import statements. We use `solidity-analyzer` for this, which scraps the imports and the solidity pragma statements from solidity files. The import paths supported for projectless files are relative and absolute path imports (i.e. no remappings, no direct imports).

If all imports were crawled successfully, we process the list of found pragma statements, and match it against a list of available solc versions using the `semver` package. The highest matched version is used for compilation.

### Other features

#### Quickfixes

Quickfixes are refactors or code changes that the language server can apply on the user's behalf.

The validation process can lead to two cases where we show diagnostics on files: solc errors/warnings, and framework file-specific errors (e.g. Hardhat validation failing on an invalid Solidity import).

Once we have these low level errors, we use `DiagnosticConverter` to generate diagnostics in the format the LSP specifies. Additionally, we have some specific handlers that may modify those diagnostics. These handlers implement the `CompilerDiagnostic` interface, and may for example, change the range of the diagnostic, underlining a function name instead of the whole function body (which solc does by default).

The language client can, when hovering over a diagnostic, send a `codeAction` request. This means it is asking for quickfixes for a specific diagnostic. With the request, the diagnostic itself is sent again to the server, so we can tell what kind of error it was and what quickfixes we can provide.

We leverage the same interface as before, `CompilerDiagnostic`, to provide code actions for a specific diagnostic. Some code actions are as simple as inserting some fixed text on a given position, but others may require parsing the file, accessing the document analyzer or invoking other tools like prettier, which we use for code formatting.

Our model for these handlers is designed in a way that we can associate them to errors based on their code. This code is either the error code returned by solc (e.g. 1878 - license identifier missing), or the framework adapter's specified code on the file-specific error raised while building a compilation (e.g. 411 hardhat's library not installed).

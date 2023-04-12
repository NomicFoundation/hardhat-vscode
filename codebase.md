# Overview

This document will help the developer getting familiar with this codebase. This includes both the overall architecture and the details of each module and some of its processes.

# Overall architecture

The codebase has three main node.js packages that are published and are considered part of this product

- VS Code extension client
- Language server
- coc.nvim extension client

Of these components, the one that involves the most complexity and holds most of the data structures and logic, is the language server. We try to keep the other two as small as possible.

Both the VS Code client and the coc.nvim client spawn the language server as a subprocess. But the latter one can also be used independently, for example using it directly with Neovim for having solidity language features.

# Language server protocol

## Brief description

Before reading the complete specification of the protocol, here's a summary of how it works.

There are two componentes, the language client and the server, that exchange messages to achieve the goal of providing language features to the user. Examples of language features are finding references, completions, quickfixes, diagnostics, etc.

This separation came to be in order to allow multiple text editors to leverage those language services from common servers, and avoid them reimplementing the language rules every time.

There are two types of messages that can be exchanged: notifications and requests. The first ones don't expect a response from the counterpart, and the latter do. Some messages are designed to be sent from the client to the server, and others the other way around.

The low level connection between the two components can be established through different channels, namely ipc (vs code, coc), stdio or socket.

The lifecycle begins by the client establishing a connection to the server, and sending an `initialize` request. This specifies what capabilities the client has, and in the response the server specifies what capabilities it supports as well. This serves as a kind of handshake.

After intialization, messages start being exchanged between the components. Some messages are sent implicitly by the editor, for instance file change events (`textDocument/didOpen`, `textDocument/didChange`), and others are originated by explicit action by the user. An example would be requesting a `textDocument/typeDefinition`.

It's useful to get familiar with the data structures that the protocol uses. These involve text document identifiers, positions, ranges, text edits, and many more. A full list can be found [here](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#basicJsonStructures).

It's important to note that on the server side, a list of open documents is updated automatically, based on `textDocument` events, leveraging the `listen` function of `TextDocuments` class.

## How we implement it

We leverage the [vscode-languageserver-node](https://github.com/microsoft/vscode-languageserver-node) package to implement our modules. Specifically we use the client, server, and protocol subpackages.

Our client module uses the `vscode-languageclient` package, which implements the client side logic of the protocol specification. It's important to note that this package is only usable through vscode extensions, that is, a module that will be loaded by vscode itself. It's not usable standalone because it depends on some modules injected by vscode runtime.

Our server module uses the `vscode-languageserver`, `vscode-languageserver-protocol`, `vscode-languageserver-types` and `vscode-languageserver-textdocument` packages.

The use of these modules allows us to only worry about the specifics of our language provider. They provide a set of helpers, types, event listeners, etc, to get up and running quickly. They also abstract away the lower level communication layers, serialization, etc.

## Full specification

It's a good idea for the developer to get familiar with the LSP, by skimming over its full [specification](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/), and keeping it for reference while working on a specific feature.

# Developing the extension

This codebase includes some launch configurations, which allows us to run the extension with our own changes, under a special vscode environment (Extension Development Host). To run this environment, run the `Launch Client` task, which should be the default (F5 for shortcut).

Additionally, there's an extra launch configuration named `Attach to Server`, which can be run after the development host is running, that will enable breakpoints for debugging the server on the main editor window.

If the extension host is behaving unexpectedly, it's a good idea to try `npm run clean` and `npm run build`, to recompile the whole project.

# Logic and responsibilities

## Client

The client is the first component that vscode loads to initialize the extension. The entry point is the `extension.ts` file, which exports an `activate()` function.

The most important part of initialization is spawning the language server, which will respond to all the client requests for language features. Some file watchers are setup at this point, so the server is notified whenever some files change on the client side. Additionally, an event listener is set up so configuration changes are notified to the server as well (e.g. telemetry options, default formatter, etc).

### Task provider

A concept that is handled 100% on the client side are the tasks. This is defined and handled by vscode, and outside the scope of the LSP.

We define some basic tasks for hardhat projects (compile, clean, test), and these can be run through the task-related commands provided by vscode.

Actually we only provide tasks for hardhat projects, and have some logic in place on client-side to detect wether active files belong to a hardhat project or not.

### Syntax highlighting

Under the `syntaxes/solidity.json` file, the syntax for solidity is defined. This is written in textmate grammar format. At the moment this is our only source of highlighting from the extension, as we don't provide semantic highlighting.

### Status items and notifications

Based on some notifications received from the server, related to indexing or validation lifecycles, we change the language status item (small icon on the status bar), to reflect wether validation is ok on the current file, or if there are some errors related to the file or the project related to that file. We also may pop some notification windows to inform of errors. The status bar is a concept defined by vscode and is not part of the LSP, and that's why we have to handle it on the client.

## coc.nvim client

This is a minimal client implementation for an extension for the coc.nvim plugin. It has good compatibility with the vscode-languageserver package and allows us to spawn the server and interact with it pretty much transparently. The only logic on this component besides spawning the language server, is syncing configuration and setting up some file watchers.

## Language Server

This is by far the most complex component, and includes all the logic related to parsing the language, supporting different solidity frameworks, interacting with solc, among others.

Before digging into language features, it's good to get familiar with some core concepts and processes: analysis, validation, indexing and framework abstraction.

### Analysis

This process consists on parsing a solidity file and its dependencies, and building a rich graph of symbols, types, expressions, etc.

The analyzer uses `solidity-parser` to build the ASTs for each source file. It then uses custom logic for enriching the nodes, and interconnecting them forming a graph.

The resulting graph is used in most language features that require type information and parsing. For example jump to definition, find implementations, function signature, etc.

The analysis process is triggered on file change, and during indexing. For optimization purposes, we only analyze local files after indexing (files local to a project, and not libraries).

### Validation

This process involves compiling a given solidity file using solc, and showing the errors/warnings in the form of diagnostics (squiggly lines).

There are many parts involved in this process, for example: determining solc version, resolving imports, compiler settings like remappings, among others.

Some of these parts are specific to the chosen framework, for example hardhat supports imports through node modules, and foundry has automatic remappings for libraries under the lib folder. Since solc doesn't know about this, we have to implement the different strategies for each framework for those specific parts. We have a project abstraction in place, which will be described next.

The validation process is triggered when a file is opened or changed. For the given file, we get the associated project and delegate the build of the solc input (part of the abstraction). In response we can get a valid solc input, or some framework-level errors. If the input is valid, then solc is invoked and a compiler output is obtained. If there are errors/warnings either from the solc output, or from the input-building step, we generate either diagnostics or status item errors, and send them back to the client using the `textDocument/publishDiagnostics` notification. Since the status item is a vscode concept, we send a custom notification for it and the client is in charge of displaying it on the window.

If a compilation is successful, all diagnostics are cleared.

### Framework abstraction

There are some processes that involve parts of logic that change depending on the framework being used on a project. Examples of this are building a solc input, resolving a given import, giving custom completions, among others.

We try to abstract away as much as possible from the different frameworks, and for that we have put in place an abstract class (`Project`), which is extended by concrete classes that implement the different frameworks.

Source files are associated to project instances during the indexing phase, and these project instances are used for aiding in the main server processes like validation and analysis. For instance, when the analyzer is crawling source files, it needs to resolve existing imports on the file.

As of now, the responsibilities that are put behind the abstraction are the following:

- Scan directories for project instances
- Test wether a file path belongs to the project
- Resolve an import path
- Initialize, and perform any setup tasks
- Build a compiler input
- React to file watchers (optional)
- Provide custom import completions (optional)
- Provide custom code actions (optional)

### Indexing

During the initialization phase of the server, we run the indexing process. This involves the following steps:

- Scanning workspace folders for projects: Each registered project adapter is called to scan a list of directories and return project instances.
- Initializing projects: Each found project is initialized sequentially. Initialization logic is specific to each project adapter.
- Scanning for solidity files: `fast-glob` is used to find all `.sol` files.
- Associating each solidity file to a project: For each found file, each project instance is tested to check wether the file belongs to them or not. Project adapters have priorities to determine which one should be assigned in case multiple of them claim that a file belongs to them.
- Analyzing local source files: From the previous step, some source files are marked as local. This concept means that they are the project's main source files, and not libraries or vendored files. Only local sources are analyzed for optimization purposes, since analysis takes up significant amount of time. It's important to note that analysis crawls the files, so libraries are also analyzed if they are imported directly or indirectly from a local source.

## Hardhat validation

This process is one of the most intrincate regarding validation, because it involves delegating the compiler input building to the hardhat library local to a project, which has several complexities on its own.

The first part happens on the hardhat adapter's initialization. When a project is indexed, it is initialized. At this point, we fork into a child process for each found project. This is necessary because we need to load multiple hardhat libraries (because we support multiple open projects) as node.js modules. If we were to attempt to load them in the same process, they would be cached and we wouldn't be able to reference multiple exported members from different modules with the same name (hardhat). So we have to first fork into a child process and then attempt to load the local hardhat module.

This model of forking into child processes add a lot of overhead to communication, since we can't just call javascript functions from the parent process to the child process. Then we need to establish a protocol using the IPC transport. Each time we need a service that involves using the HRE, we need to send a message to the child process and wait for a response. We try to keep this communication as tidy as possible using the tools that typescript provides us.

Once a validation request comes in, the projects send the worker a BuildCompilationRequest. Then the compilation building happens all on the child process' side. What we do is replicate most of hardhat's task invocation logic for the `compile` task. On a high level, it involves getting the source paths, getting the source names, building the dependency graph, building a compilation job, and getting the compiler input.

Some of these tasks we override for optimization purposes, for example when consecutively validating a file whose imports didn't change, we avoid rebuilding the dependency graph for it. We also override the `READ_FILE` task from hardhat to attempt to get the file contents from memory instead of reading them from disk. This is both an optimization and also allows us to use unsaved files from the editor.

If at any point hadhat rejects one of the tasks, we bubble up that result to the client, indicating the source of the error and in some cases providing quickfixes for it.

## Foundry validation

Building compilations for foundry projects is a bit simpler because we leverage our implementation for "projectless" solidity files, i.e. files that don't belong to any known framework. Besides that basic logic we add some points that are specific to foundry.

Building a basic compilation involves scanning the target file for imports, and then scanning those imported files recursively. When this process finishes, we have a flat list of files to be compiled and a list of pragma statements which we can use to find a suitable version, or verify that the project's specified one matches the criterias. We then read the file contents from memory, using our solidity files index (all files are indexed on server initialization). This makes the compilation building very fast, since we don't read files from disk.

The compilation details from the basic strategy has the source file keys in absolute path format. This is accepted by solc but we need to transform them to relative paths (from the project root) for giving full support to foundry projects. So the sources' keys change from e.g. `/path/to/project/src/MyContract.sol` to `src/MyContract.sol` on foundry projects.

After this transformation, foundry's remappings are added to the compilation's `input.settings`. These remappings are obtained during the initialization stage, where we invoke `forge` to obtain different configuration values. It's important to note that forge provides the remappings in a recurve manner, so by invoking it on the root project also gives us the remappings from the imported libraries and their dependencies recursively.

## Quickfixes

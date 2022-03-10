"use strict";

import * as path from "path";
import * as vscode from "vscode";
import * as lsclient from "vscode-languageclient/node";

import { sleep } from "./common/helper";
import { Client as IClient } from "./common/types";
import { NavigationProvider } from "./services/NavigationProvider";

let client: Client;
export async function getClient(): Promise<Client> {
  if (client) {
    return client;
  }

  client = new Client();
  try {
    await client.activate();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  }

  return client;
}

class Client implements IClient {
  private client: lsclient.LanguageClient;
  private middleware: lsclient.Middleware;
  private tokenSource: vscode.CancellationTokenSource =
    new vscode.CancellationTokenSource();
  private editor: vscode.TextEditor;

  document: vscode.TextDocument;
  docUri: vscode.Uri;

  navigationProvider: NavigationProvider;

  /**
   * Activates the extension
   */
  async activate(): Promise<void> {
    // The extensionId is `publisher.name` from package.json
    const ext = vscode.extensions.getExtension(
      "nomicfoundation.hardhat-solidity"
    );

    await ext.activate();

    const serverModule = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "server",
      "out",
      "index.js"
    );
    const serverOptions: lsclient.ServerOptions = {
      run: { module: serverModule, transport: lsclient.TransportKind.ipc },
      debug: {
        module: serverModule,
        transport: lsclient.TransportKind.ipc,
        options: { execArgv: ["--nolazy", "--inspect=6014"] },
      },
    };

    this.middleware = {};
    const clientOptions: lsclient.LanguageClientOptions = {
      documentSelector: [{ scheme: "file", language: "solidity" }],
      synchronize: {
        fileEvents: vscode.workspace.createFileSystemWatcher("**/.sol"),
      },
      middleware: this.middleware,
    };

    this.client = new lsclient.LanguageClient(
      "testSolidityLanguageServer",
      "Test Solidity Language Server",
      serverOptions,
      clientOptions
    );

    this.client.start();

    await this.client.onReady();

    this.navigationProvider = new NavigationProvider(
      this.client,
      this.tokenSource
    );

    // Wait for analyzer to indexing all files
    await sleep(5000);
  }

  async changeDocument(docUri: vscode.Uri) {
    this.docUri = docUri;

    this.document = await vscode.workspace.openTextDocument(this.docUri);
    this.editor = await vscode.window.showTextDocument(this.document);
  }

  getVSCodeClient(): lsclient.LanguageClient {
    return this.client;
  }
}

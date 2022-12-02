"use strict";

import * as path from "path";
import * as vscode from "vscode";
import * as lsclient from "vscode-languageclient/node";

import { sleep } from "./helpers/sleep";
import { Client as IClient } from "./common/types";

let client: Client | null = null;

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
  public client: lsclient.LanguageClient;
  public tokenSource: vscode.CancellationTokenSource =
    new vscode.CancellationTokenSource();

  public document: vscode.TextDocument | null = null;
  public docUri: vscode.Uri | null = null;

  constructor() {
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

    const clientOptions: lsclient.LanguageClientOptions = {
      documentSelector: [{ scheme: "file", language: "solidity" }],
      synchronize: {
        fileEvents: vscode.workspace.createFileSystemWatcher("**/.sol"),
      },
      initializationOptions: {
        extensionName: "nomicfoundation.hardhat-solidity",
        extensionVersion: "0.0.0",
        env: "development",
        globalTelemetryEnabled: false,
        hardhatTelemetryEnabled: false,
        machineId: "fake-interagtion-machine-id",
      },
    };

    this.client = new lsclient.LanguageClient(
      "testSolidityLanguageServer",
      "Test Solidity Language Server",
      serverOptions,
      clientOptions
    );
  }

  /**
   * Activates the extension
   */
  public async activate(): Promise<void> {
    // The extensionId is `publisher.name` from package.json
    const ext = vscode.extensions.getExtension(
      "nomicfoundation.hardhat-solidity"
    );

    if (!ext) {
      throw new Error("Extension not found");
    }

    await ext.activate();

    this.client.start();

    await this.client.onReady();

    // while (ext.exports.isReady() !== true) {
    //   await sleep(100);
    // }

    await sleep(10000);
  }

  public async changeDocument(docUri: vscode.Uri) {
    this.docUri = docUri;

    this.document = await vscode.workspace.openTextDocument(this.docUri);
  }
}

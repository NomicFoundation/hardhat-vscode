'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import * as lsclient from 'vscode-languageclient/node';

import { sleep } from './common/helper';
import { IndexFileData, Client as IClient } from './common/types';
import { NavigationProvider } from './services/NavigationProvider';

let client: Client;
export async function getClient(): Promise<Client> {
    if (client) {
        return client;
    }

    client = new Client();
    try {
        await client.activate();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }

    return client;
}

class Client implements IClient {
    private client: lsclient.LanguageClient;
    private middleware: lsclient.Middleware;
    private tokenSource: vscode.CancellationTokenSource;
    private editor: vscode.TextEditor;

    document: vscode.TextDocument;
    docUri: vscode.Uri;

    navigationProvider: NavigationProvider;

    /**
     * Activates the tenderly.solidity-extension extension
     */
    async activate(): Promise<void> {
        // The extensionId is `publisher.name` from package.json
        const ext = vscode.extensions.getExtension('tenderly.solidity-extension')!;
        await ext.activate();
    
        this.docUri = vscode.Uri.file(this.getDocPath(path.resolve(__dirname, 'tests', 'single-file-navigation'), 'test.sol'));
        this.document = await vscode.workspace.openTextDocument(this.docUri);
        this.editor = await vscode.window.showTextDocument(this.document);

        await sleep(2000); // Wait for server activation

        this.tokenSource = new vscode.CancellationTokenSource();
    
        const serverModule = path.join(__dirname, '..', '..', '..', 'server', 'out', 'server.js');
        const serverOptions: lsclient.ServerOptions = {
            run: { module: serverModule, transport: lsclient.TransportKind.ipc },
            debug: { module: serverModule, transport: lsclient.TransportKind.ipc, options: { execArgv: ['--nolazy', '--inspect=6014'] } }
        };

        this.middleware = {};
        const clientOptions: lsclient.LanguageClientOptions = {
            documentSelector: [{ scheme: 'file', language: 'solidity' }],
            synchronize: {
                fileEvents: vscode.workspace.createFileSystemWatcher('**/.sol')
            },
            middleware: this.middleware
        };
    
        this.client = new lsclient.LanguageClient(
            'testSolidityLanguageServer',
            'Test Solidity Language Server',
            serverOptions,
            clientOptions
        );

        this.client.start();
        await this.client.onReady();
    
        this.navigationProvider = new NavigationProvider(this.client, this.tokenSource);

        // Wait for analyzer to indexing all files
        await sleep(5000);
    }

    getDocPath(dirname: string, p: string): string {
        // TO-DO: Refactor this
        dirname = dirname.replace('/out/', '/');
        return path.resolve(dirname, 'testdata', p);
    }

    getDocUri(dirname: string, p: string): vscode.Uri {
        return vscode.Uri.file(this.getDocPath(dirname, p));
    }

    async changeDocument(docUri: vscode.Uri): Promise<void> {
        try {
            this.document = await vscode.workspace.openTextDocument(docUri);
            this.editor = await vscode.window.showTextDocument(this.document);
        } catch (err) {
            console.error(err);
        }
    }

    getVSCodeClient(): lsclient.LanguageClient {
        return this.client;
    }
}

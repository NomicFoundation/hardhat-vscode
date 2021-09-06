'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import * as lsclient from 'vscode-languageclient/node';

import { sleep } from './common/helper';
import { IndexFileData } from './common/types';
import { NavigationProvider } from './services/NavigationProvider';

let client: Client;
export async function getClient(): Promise<Client> {
    if (client) {
        return client;
    }

    client = new Client();
    await client.activate();

    return client;
}

class Client {
    private client: lsclient.LanguageClient;
    private middleware: lsclient.Middleware;
    private tokenSource: vscode.CancellationTokenSource;
    private docUri: vscode.Uri;
    
    private document: vscode.TextDocument;
    private editor: vscode.TextEditor;

    navigationProvider: NavigationProvider;

    /**
     * Activates the tenderly.solidity-extension extension
     */
    async activate(): Promise<void> {
        // The extensionId is `publisher.name` from package.json
        const ext = vscode.extensions.getExtension('tenderly.solidity-extension')!;
        await ext.activate();
    
        const defaultFilePath = this.getDocPath(path.resolve(__dirname, 'tests', 'single_file_navigation'), 'test.sol');
        this.document = await vscode.workspace.openTextDocument(defaultFilePath);
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
    
        // Wait for analyzer to indexing all files
        const promise = new Promise<void>(resolve => {
            this.client.onNotification("custom/indexingFile", (data: IndexFileData) => {
                if (data.current === data.total) {
                    resolve();
                }
            });
        });
    
        await promise;

        this.navigationProvider = new NavigationProvider(this.client, this.tokenSource);
    }

    getDocPath(dirname: string, p: string) {
        // TO-DO: Refactor this
        dirname = dirname.replace('out/', '');
        return path.resolve(dirname, 'testdata', p);
    }

    getDocUri(dirname: string, p: string) {
        return vscode.Uri.file(this.getDocPath(dirname, p));
    }
}

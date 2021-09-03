'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const assert = require("assert");
const vscode = require("vscode");
const lsclient = require("vscode-languageclient/node");
const helper_1 = require("./helper");
suite('Client integration', () => {
    let client;
    let middleware;
    let tokenSource;
    let docUri;
    suiteSetup(async () => {
        docUri = helper_1.getDocUri('test.sol');
        await helper_1.activate(docUri);
        tokenSource = new vscode.CancellationTokenSource();
        const serverModule = path.join(__dirname, '..', '..', '..', 'server', 'dist', 'server.js');
        const serverOptions = {
            run: { module: serverModule, transport: lsclient.TransportKind.ipc },
            debug: { module: serverModule, transport: lsclient.TransportKind.ipc, options: { execArgv: ['--nolazy', '--inspect=6014'] } }
        };
        middleware = {};
        const clientOptions = {
            documentSelector: [{ scheme: 'file', language: 'solidity' }],
            synchronize: {
                fileEvents: vscode.workspace.createFileSystemWatcher('**/.sol')
            },
            middleware
        };
        client = new lsclient.LanguageClient('testSolidityLanguageServer', 'Test Solidity Language Server', serverOptions, clientOptions);
        client.start();
        await client.onReady();
    });
    suiteTeardown(async () => {
        await client.stop();
    });
    test('InitializeResult', () => {
        const expected = {
            capabilities: {
                textDocumentSync: 2,
                completionProvider: {
                    triggerCharacters: [
                        '.', '/'
                    ]
                },
                definitionProvider: true,
                typeDefinitionProvider: true,
                referencesProvider: true,
                implementationProvider: true,
                renameProvider: true,
                workspace: {
                    workspaceFolders: {
                        supported: true
                    }
                }
            }
        };
        assert.deepStrictEqual(client.initializeResult, expected);
    });
    test('Goto Definition', async () => {
        docUri = helper_1.getDocUri('test1.sol');
        await helper_1.changeDocument(docUri);
        const provider = client.getFeature(lsclient.DefinitionRequest.method).getProvider(helper_1.document);
        helper_1.isDefined(provider);
        const position = new vscode.Position(67, 14);
        const result = (await provider.provideDefinition(helper_1.document, position, tokenSource.token));
        helper_1.isInstanceOf(result, vscode.Location);
        helper_1.uriEqual(result.uri, docUri);
        helper_1.rangeEqual(result.range, 96, 0, 113, 0);
    });
    test('Goto Type Definition', async () => {
        docUri = helper_1.getDocUri('test.sol');
        await helper_1.changeDocument(docUri);
        const provider = client.getFeature(lsclient.TypeDefinitionRequest.method).getProvider(helper_1.document);
        helper_1.isDefined(provider);
        const position = new vscode.Position(41, 16);
        const results = (await provider.provideTypeDefinition(helper_1.document, position, tokenSource.token));
        helper_1.isArray(results, vscode.Location);
        for (const result of results) {
            helper_1.isInstanceOf(result, vscode.Location);
            helper_1.uriEqual(result.uri, docUri);
            helper_1.rangeEqual(result.range, 15, 11, 15, 19);
        }
    });
    test('Find References', async () => {
        docUri = helper_1.getDocUri('test.sol');
        await helper_1.changeDocument(docUri);
        const expectedResults = JSON.parse('[{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":27,"character":22},{"line":27,"character":31}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":41,"character":12},{"line":41,"character":21}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":104,"character":12},{"line":104,"character":21}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":124,"character":8},{"line":124,"character":17}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":133,"character":29},{"line":133,"character":38}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":134,"character":16},{"line":134,"character":25}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":135,"character":35},{"line":135,"character":44}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},"range":[{"line":147,"character":22},{"line":147,"character":31}]}]');
        const provider = client.getFeature(lsclient.ReferencesRequest.method).getProvider(helper_1.document);
        helper_1.isDefined(provider);
        const position = new vscode.Position(41, 16);
        const results = (await provider.provideReferences(helper_1.document, position, {
            includeDeclaration: true
        }, tokenSource.token));
        helper_1.isArray(results, vscode.Location, 8);
        for (let i = 0; i < results.length; i++) {
            helper_1.isInstanceOf(results[i], vscode.Location);
            helper_1.uriEqual(results[i].uri, expectedResults[i].uri);
            helper_1.rangeEqual(results[i].range, expectedResults[i].range[0].line, expectedResults[i].range[0].character, expectedResults[i].range[1].line, expectedResults[i].range[1].character);
        }
    });
    test('Find Implementations', async () => {
        docUri = helper_1.getDocUri('test1.sol');
        await helper_1.changeDocument(docUri);
        const expectedResults = JSON.parse('[{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test1.sol","scheme":"file"},"range":[{"line":11,"character":9},{"line":11,"character":10}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test1.sol","scheme":"file"},"range":[{"line":33,"character":14},{"line":33,"character":15}]},{"uri":{"$mid":1,"path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test1.sol","scheme":"file"},"range":[{"line":48,"character":14},{"line":48,"character":15}]}]');
        const provider = client.getFeature(lsclient.ImplementationRequest.method).getProvider(helper_1.document);
        helper_1.isDefined(provider);
        const position = new vscode.Position(11, 10);
        const results = (await provider.provideImplementation(helper_1.document, position, tokenSource.token));
        helper_1.isArray(results, vscode.Location, 3);
        for (let i = 0; i < results.length; i++) {
            helper_1.isInstanceOf(results[i], vscode.Location);
            helper_1.uriEqual(results[i].uri, expectedResults[i].uri);
            helper_1.rangeEqual(results[i].range, expectedResults[i].range[0].line, expectedResults[i].range[0].character, expectedResults[i].range[1].line, expectedResults[i].range[1].character);
        }
    });
    test('Do Rename', async () => {
        docUri = helper_1.getDocUri('test.sol');
        await helper_1.changeDocument(docUri);
        const expectedResults = JSON.parse('[{"$mid":1,"external":"file:///Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","path":"/Users/riphal/Documents/Tenderly/vscode-solidity/client/src/test/testFixture/test.sol","scheme":"file"},[{"range":[{"line":27,"character":22},{"line":27,"character":31}],"newText":"newName"},{"range":[{"line":41,"character":12},{"line":41,"character":21}],"newText":"newName"},{"range":[{"line":104,"character":12},{"line":104,"character":21}],"newText":"newName"},{"range":[{"line":124,"character":8},{"line":124,"character":17}],"newText":"newName"},{"range":[{"line":133,"character":29},{"line":133,"character":38}],"newText":"newName"},{"range":[{"line":134,"character":16},{"line":134,"character":25}],"newText":"newName"},{"range":[{"line":135,"character":35},{"line":135,"character":44}],"newText":"newName"},{"range":[{"line":147,"character":22},{"line":147,"character":31}],"newText":"newName"}]]');
        const provider = client.getFeature(lsclient.RenameRequest.method).getProvider(helper_1.document);
        helper_1.isDefined(provider);
        const position = new vscode.Position(41, 16);
        const renameResult = await provider.provideRenameEdits(helper_1.document, position, 'newName', tokenSource.token);
        helper_1.isInstanceOf(renameResult, vscode.WorkspaceEdit);
        for (const results of renameResult.entries()) {
            if (results.length !== 2) {
                throw new Error(`Result [vscode.Uri, vscode.TextEdit[]].length must be 2`);
            }
            helper_1.isInstanceOf(results[0], vscode.Uri);
            helper_1.uriEqual(results[0], expectedResults[0]);
            const textEdits = results[1];
            for (let i = 0; i < textEdits.length; i++) {
                helper_1.isInstanceOf(textEdits[i], vscode.TextEdit);
                assert.strictEqual(textEdits[i].newText, expectedResults[1][i].newText);
                helper_1.rangeEqual(textEdits[i].range, expectedResults[1][i].range[0].line, expectedResults[1][i].range[0].character, expectedResults[1][i].range[1].line, expectedResults[1][i].range[1].character);
            }
        }
    });
});
//# sourceMappingURL=integration.test.js.map
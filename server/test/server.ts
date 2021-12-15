import * as assert from 'assert';
import setupServer from '../src/server';
import { setupMockConnection } from './helpers/setupMockConnection';

describe("Solidity Language Server", () => {
  describe('initialization', () => {
    describe("capability registration", () => {
      let mockConnection: ReturnType<typeof setupMockConnection>;
      let capabilities: any;

      before(async () => {
        mockConnection = setupMockConnection();

        await setupServer(mockConnection as any);

        assert(mockConnection.onInitialize.called);
        const initialize = mockConnection.onInitialize.getCall(0).firstArg;
        assert(initialize);

        const initializeResponse = initialize({ rootUri: null, capabilities: {} });
        assert(initializeResponse);
        capabilities = initializeResponse.capabilities;
        assert(capabilities);
      });

      describe("completions", () => {
        it("advertises capability", () => assert.deepStrictEqual(capabilities.completionProvider, {
          triggerCharacters: [
            '.', '/'
          ]
        }));

        it("registers onCompletion", () => assert(mockConnection.onCompletion.calledOnce));
      });

      describe("signature help", () => {
        it("advertises capability", () => assert.deepStrictEqual(capabilities.signatureHelpProvider, {
          triggerCharacters: ['(', ',']
        }));

        it("registers onSignatureHelp", () => assert(mockConnection.onSignatureHelp.calledOnce));
      });

      describe("definition", () => {
        it("advertises capability", () => assert(capabilities.definitionProvider));

        it("registers onDefinition", () => assert(mockConnection.onDefinition.calledOnce));
      });

      describe("type definition", () => {
        it("advertises capability", () => assert(capabilities.typeDefinitionProvider));

        it("registers onTypeDefinition", () => assert(mockConnection.onTypeDefinition.calledOnce));
      });

      describe("references", () => {
        it("advertises capability", () => assert(capabilities.referencesProvider));

        it("registers onImplementation", () => assert(mockConnection.onReferences.calledOnce));
      });

      describe("implementation", () => {
        it("advertises capability", () => assert(capabilities.implementationProvider));

        it("registers onImplementation", () => assert(mockConnection.onImplementation.calledOnce));
      });

      describe("rename", () => {
        it("advertises capability", () => assert(capabilities.renameProvider));

        it("registers onRenameRequest", () => assert(mockConnection.onRenameRequest.calledOnce));
      });
    });
  });
});

import { assert } from "chai";
import { onDidOpen } from "@services/documents/onDidOpen";
import { TextDocument } from "vscode-languageserver-textdocument";
import { TextDocuments } from "vscode-languageserver/node";
import { ClientTrackingState } from "@common/types";
import { onDidChangeContent } from "@services/documents/onDidChangeContent";
import { onDidClose } from "@services/documents/onDidClose";
import { onDidSave } from "@services/documents/onDidSave";
import { ServerState } from "../../../src/types";
import { setupMockCompilerProcessFactory } from "../../helpers/setupMockCompilerProcessFactory";
import { setupMockConnection } from "../../helpers/setupMockConnection";
import { setupMockLogger } from "../../helpers/setupMockLogger";
import { setupMockTelemetry } from "../../helpers/setupMockTelemetry";

describe("documents", () => {
  describe("tracking", () => {
    describe("on open", () => {
      it("sets tracking as on", () => {
        const serverState: ServerState = setupServerState();

        const change = {
          document: TextDocument.create("/example/file.sol", "solidity", 0, ""),
        };

        onDidOpen(serverState)(change);

        const fileEntry = serverState.solFileIndex["/example/file.sol"];

        assert.equal(fileEntry.tracking, ClientTrackingState.TRACKED);
      });

      it("ignores non-solidity files", () => {
        const serverState: ServerState = setupServerState();

        const change = {
          document: TextDocument.create(
            "/example/not-solidity.js",
            "javascript",
            0,
            "// ignore"
          ),
        };

        onDidOpen(serverState)(change);

        const fileEntry = serverState.solFileIndex["/example/not-solidity.js"];

        assert.isUndefined(fileEntry);
      });
    });

    describe("on change", () => {
      it("sets tracking as on", () => {
        const serverState: ServerState = setupServerState();

        const change = {
          document: TextDocument.create("/example/file.sol", "solidity", 0, ""),
        };

        onDidOpen(serverState)(change);
        onDidChangeContent(serverState)(change);

        const fileEntry = serverState.solFileIndex["/example/file.sol"];

        assert.equal(fileEntry.tracking, ClientTrackingState.TRACKED);
      });

      it("logs and ignores on error", () => {
        const serverState: ServerState = setupServerState();

        serverState.logger.trace = () => {
          throw new Error("Unexpected");
        };

        const change = {
          document: TextDocument.create("/example/file.sol", "solidity", 0, ""),
        };

        onDidChangeContent(serverState)(change);

        assert(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (serverState.logger.error as any).calledOnce,
          "error was not logged"
        );
      });

      it("ignores non-solidity files", () => {
        const serverState: ServerState = setupServerState();

        const change = {
          document: TextDocument.create(
            "/example/not-solidity.js",
            "javascript",
            0,
            "// ignore"
          ),
        };

        onDidChangeContent(serverState)(change);

        const fileEntry = serverState.solFileIndex["/example/not-solidity.js"];

        assert.isUndefined(fileEntry);
      });
    });

    describe("on close", () => {
      it("sets tracking as on", () => {
        const serverState: ServerState = setupServerState();

        const change = {
          document: TextDocument.create("/example/file.sol", "solidity", 0, ""),
        };

        onDidOpen(serverState)(change);
        onDidChangeContent(serverState)(change);
        onDidClose(serverState)(change);

        const fileEntry = serverState.solFileIndex["/example/file.sol"];

        assert.equal(fileEntry.tracking, ClientTrackingState.UNTRACKED);
      });

      it("ignores non-solidity files", () => {
        const serverState: ServerState = setupServerState();

        const change = {
          document: TextDocument.create(
            "/example/not-solidity.js",
            "javascript",
            0,
            "// ignore"
          ),
        };

        onDidClose(serverState)(change);

        const fileEntry = serverState.solFileIndex["/example/not-solidity.js"];

        assert.isUndefined(fileEntry);
      });
    });

    describe("on save", () => {
      it("sets tracking as on", () => {
        const serverState: ServerState = setupServerState();

        const change = {
          document: TextDocument.create("/example/file.sol", "solidity", 0, ""),
        };

        onDidSave(serverState)(change);

        const fileEntry = serverState.solFileIndex["/example/file.sol"];

        assert.equal(fileEntry.tracking, ClientTrackingState.TRACKED);
      });

      it("ignores non-solidity files", () => {
        const serverState: ServerState = setupServerState();

        const change = {
          document: TextDocument.create(
            "/example/not-solidity.js",
            "javascript",
            0,
            "// ignore"
          ),
        };

        onDidSave(serverState)(change);

        const fileEntry = serverState.solFileIndex["/example/not-solidity.js"];

        assert.isUndefined(fileEntry);
      });
    });
  });
});

function setupServerState(): ServerState {
  const mockConnection = setupMockConnection();
  const mockTelemetry = setupMockTelemetry();
  const compProcessFactory = setupMockCompilerProcessFactory();
  const logger = setupMockLogger();

  return {
    env: "production",
    hasWorkspaceFolderCapability: true,

    globalTelemetryEnabled: false,
    hardhatTelemetryEnabled: false,
    indexJobCount: 0,

    compProcessFactory,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connection: mockConnection as any,
    documents: new TextDocuments(TextDocument),
    workspaceFolders: [],
    projects: {},
    solFileIndex: {},
    workerProcesses: {},

    telemetry: mockTelemetry,
    logger,
  };
}

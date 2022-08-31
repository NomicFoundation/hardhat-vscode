/* eslint-disable @typescript-eslint/no-explicit-any */
import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";
import {
  indexWorkspaceFolders,
  IndexWorkspaceFoldersContext,
} from "@services/initialization/indexWorkspaceFolders";
import { assert } from "chai";
import * as sinon from "sinon";
import { WorkspaceFolder } from "vscode-languageserver";
import { setupMockConnection } from "../../helpers/setupMockConnection";
import { setupMockLogger } from "../../helpers/setupMockLogger";
import { setupMockWorkspaceFileRetriever } from "../../helpers/setupMockWorkspaceFileRetriever";

describe("initialization", () => {
  describe("indexing workspace folders", () => {
    describe("adding single workspace with projects and sol files", () => {
      let serverState: IndexWorkspaceFoldersContext;
      let addedFolders: WorkspaceFolder[];

      before(async () => {
        addedFolders = [
          {
            name: "example",
            uri: "file:///data/example",
          },
        ];

        const mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever(
          {
            "/data/example": ["/data/example/hardhat.config.ts"],
          },
          {
            "/data/example": ["/data/example/contracts/one.sol"],
          }
        );

        serverState = buildServerState({ existingFolders: [] });

        await indexWorkspaceFolders(
          serverState,
          mockWorkspaceFileRetriever,
          addedFolders
        );
      });

      it("should add a new workspace folder ", () => {
        assert.deepStrictEqual(serverState.workspaceFolders, addedFolders);
      });

      it("should add projects", () => {
        assert.deepStrictEqual(serverState.projects, {
          "/data/example": {
            basePath: "/data/example",
            configPath: "/data/example/hardhat.config.ts",
            type: "hardhat",
            remappings: [],
            workspaceFolder: {
              name: "example",
              uri: "file:///data/example",
            },
          },
        });
      });

      it("should add solidity files", () => {
        assert("/data/example/contracts/one.sol" in serverState.solFileIndex);
      });

      it("should notify the client of indexing starting", () => {
        sinon.assert.calledWithExactly(
          serverState.connection.sendNotification as any,
          "custom/indexing-start",
          {
            jobId: 1,
            path: "",
            current: 0,
            total: 0,
          }
        );
      });

      it("should notify the client of indexing finishing", () => {
        sinon.assert.calledWithExactly(
          serverState.connection.sendNotification as any,
          "custom/indexing-file",
          {
            jobId: 1,
            path: "/data/example/contracts/one.sol",
            current: 1,
            total: 1,
          }
        );
      });
    });

    describe("adding single workspace with multiple projects", () => {
      let serverState: IndexWorkspaceFoldersContext;
      let addedFolders: WorkspaceFolder[];

      before(async () => {
        addedFolders = [
          {
            name: "example",
            uri: "file:///data/example",
          },
        ];

        const mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever(
          {
            "/data/example": [
              "/data/example/packages/first/hardhat.config.ts",
              "/data/example/packages/second/hardhat.config.ts",
            ],
          },
          {
            "/data/example": [
              "/data/example/packages/first/contracts/A.sol",
              "/data/example/packages/first/contracts/B.sol",
              "/data/example/packages/second/contracts/C.sol",
              "/data/example/packages/second/contracts/D.sol",
            ],
          }
        );

        serverState = buildServerState({ existingFolders: [] });

        await indexWorkspaceFolders(
          serverState,
          mockWorkspaceFileRetriever,
          addedFolders
        );
      });

      it("should add a new workspace folder ", () => {
        assert.deepStrictEqual(serverState.workspaceFolders, addedFolders);
      });

      it("should add multiple projects", () => {
        assert.deepStrictEqual(serverState.projects, {
          "/data/example/packages/first": {
            basePath: "/data/example/packages/first",
            configPath: "/data/example/packages/first/hardhat.config.ts",
            type: "hardhat",
            remappings: [],
            workspaceFolder: {
              name: "example",
              uri: "file:///data/example",
            },
          },
          "/data/example/packages/second": {
            basePath: "/data/example/packages/second",
            configPath: "/data/example/packages/second/hardhat.config.ts",
            type: "hardhat",
            remappings: [],
            workspaceFolder: {
              name: "example",
              uri: "file:///data/example",
            },
          },
        });
      });

      it("should add solidity files", () => {
        assert(
          "/data/example/packages/first/contracts/A.sol" in
            serverState.solFileIndex
        );
        assert(
          "/data/example/packages/first/contracts/B.sol" in
            serverState.solFileIndex
        );
        assert(
          "/data/example/packages/second/contracts/C.sol" in
            serverState.solFileIndex
        );
        assert(
          "/data/example/packages/second/contracts/D.sol" in
            serverState.solFileIndex
        );
      });

      it("should notify the client of indexing starting", () => {
        sinon.assert.calledWithExactly(
          serverState.connection.sendNotification as any,
          "custom/indexing-start",
          {
            jobId: 1,
            path: "",
            current: 0,
            total: 0,
          }
        );
      });

      it("should notify the client of indexing finishing", () => {
        sinon.assert.calledWith(
          serverState.connection.sendNotification as any,
          "custom/indexing-file",
          {
            jobId: 1,
            path: "/data/example/packages/second/contracts/D.sol",
            current: 4,
            total: 4,
          }
        );
      });
    });

    describe("adding multiple workspaces with projects and sol files", () => {
      let serverState: IndexWorkspaceFoldersContext;
      let addedFolders: WorkspaceFolder[];

      before(async () => {
        addedFolders = [
          {
            name: "first",
            uri: "file:///data/example/packages/first",
          },
          {
            name: "second",
            uri: "file:///data/example/packages/second",
          },
          {
            name: "third",
            uri: "file:///data/example/packages/third",
          },
        ];

        const mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever(
          {
            "/data/example/packages/first": [
              "/data/example/packages/first/hardhat.config.ts",
            ],
            "/data/example/packages/second": [
              "/data/example/packages/second/hardhat.config.js",
            ],
            "/data/example/packages/third": [
              "/data/example/packages/third/hardhat.config.ts",
            ],
          },
          {
            "/data/example/packages/first": [
              "/data/example/packages/first/contracts/A.sol",
              "/data/example/packages/first/contracts/B.sol",
            ],
            "/data/example/packages/second": [
              "/data/example/packages/second/contracts/C.sol",
              "/data/example/packages/second/contracts/D.sol",
            ],
            "/data/example/packages/third": [
              "/data/example/packages/third/contracts/E.sol",
              "/data/example/packages/third/contracts/F.sol",
            ],
          }
        );

        serverState = buildServerState({ existingFolders: [] });

        await indexWorkspaceFolders(
          serverState,
          mockWorkspaceFileRetriever,
          addedFolders
        );
      });

      it("should add multiple workspace folders", () => {
        assert.deepStrictEqual(serverState.workspaceFolders, addedFolders);
      });

      it("should add multiple projects", () => {
        assert.deepStrictEqual(serverState.projects, {
          "/data/example/packages/first": {
            basePath: "/data/example/packages/first",
            configPath: "/data/example/packages/first/hardhat.config.ts",
            type: "hardhat",
            remappings: [],
            workspaceFolder: {
              name: "first",
              uri: "file:///data/example/packages/first",
            },
          },
          "/data/example/packages/second": {
            basePath: "/data/example/packages/second",
            configPath: "/data/example/packages/second/hardhat.config.js",
            type: "hardhat",
            remappings: [],
            workspaceFolder: {
              name: "second",
              uri: "file:///data/example/packages/second",
            },
          },
          "/data/example/packages/third": {
            basePath: "/data/example/packages/third",
            configPath: "/data/example/packages/third/hardhat.config.ts",
            type: "hardhat",
            remappings: [],
            workspaceFolder: {
              name: "third",
              uri: "file:///data/example/packages/third",
            },
          },
        });
      });

      it("should add solidity files", () => {
        assert(
          "/data/example/packages/first/contracts/A.sol" in
            serverState.solFileIndex
        );
        assert(
          "/data/example/packages/first/contracts/B.sol" in
            serverState.solFileIndex
        );
        assert(
          "/data/example/packages/second/contracts/C.sol" in
            serverState.solFileIndex
        );
        assert(
          "/data/example/packages/second/contracts/D.sol" in
            serverState.solFileIndex
        );
        assert(
          "/data/example/packages/third/contracts/E.sol" in
            serverState.solFileIndex
        );
        assert(
          "/data/example/packages/third/contracts/F.sol" in
            serverState.solFileIndex
        );
      });

      it("should notify the client of indexing starting", () => {
        sinon.assert.calledWithExactly(
          serverState.connection.sendNotification as any,
          "custom/indexing-start",
          {
            jobId: 1,
            path: "",
            current: 0,
            total: 0,
          }
        );
      });

      it("should notify the client of indexing finishing", () => {
        sinon.assert.calledWith(
          serverState.connection.sendNotification as any,
          "custom/indexing-file",
          {
            jobId: 1,
            path: "/data/example/packages/third/contracts/F.sol",
            current: 6,
            total: 6,
          }
        );
      });
    });

    describe("adding single workspace with no projects or sol files", () => {
      let serverState: IndexWorkspaceFoldersContext;
      let addedFolders: WorkspaceFolder[];

      before(async () => {
        addedFolders = [
          {
            name: "example",
            uri: "file:///data/example",
          },
        ];

        const mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever();

        serverState = buildServerState({ existingFolders: [] });

        await indexWorkspaceFolders(
          serverState,
          mockWorkspaceFileRetriever,
          addedFolders
        );
      });

      it("should add a new workspace folder ", () => {
        assert.deepStrictEqual(serverState.workspaceFolders, addedFolders);
      });

      it("should not add any projects", () => {
        assert.deepStrictEqual(serverState.projects, {});
      });

      it("should not add any solidity files", () => {
        assert.deepStrictEqual(serverState.solFileIndex, {});
      });

      it("should notify the client of indexing starting", () => {
        sinon.assert.calledWithExactly(
          serverState.connection.sendNotification as any,
          "custom/indexing-start",
          {
            jobId: 1,
            path: "",
            current: 0,
            total: 0,
          }
        );
      });

      it("should notify the client of indexing finishing", () => {
        sinon.assert.calledWithExactly(
          serverState.connection.sendNotification as any,
          "custom/indexing-file",
          { jobId: 1, path: "", current: 0, total: 0 }
        );
      });
    });

    describe("adding single workspace that has been previously indexed", () => {
      let serverState: IndexWorkspaceFoldersContext;
      let existingFolders: WorkspaceFolder[];
      let addedFolders: WorkspaceFolder[];
      let mockWorkspaceFileRetriever: WorkspaceFileRetriever;

      before(async () => {
        existingFolders = [
          {
            name: "example",
            uri: "file:///data/example",
          },
        ];

        addedFolders = [
          {
            name: "example",
            uri: "file:///data/example",
          },
        ];

        mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever();

        serverState = buildServerState({ existingFolders });

        await indexWorkspaceFolders(
          serverState,
          mockWorkspaceFileRetriever,
          addedFolders
        );
      });

      it("should not change the existing folders", () => {
        assert.deepStrictEqual(serverState.workspaceFolders, existingFolders);
      });

      it("should not scan for projects or sol files", () => {
        sinon.assert.notCalled(mockWorkspaceFileRetriever.findFiles as any);
      });

      it("should notify the client of indexing starting", () => {
        sinon.assert.calledWithExactly(
          serverState.connection.sendNotification as any,
          "custom/indexing-start",
          {
            jobId: 1,
            path: "",
            current: 0,
            total: 0,
          }
        );
      });

      it("should notify the client of indexing finishing", () => {
        sinon.assert.calledWithExactly(
          serverState.connection.sendNotification as any,
          "custom/indexing-file",
          { jobId: 1, path: "", current: 0, total: 0 }
        );
      });
    });

    describe("adding two workspaces, one nested within the other", () => {
      let serverState: IndexWorkspaceFoldersContext;
      let existingFolders: WorkspaceFolder[];
      let addedFolders: WorkspaceFolder[];

      before(async () => {
        existingFolders = [];

        addedFolders = [
          {
            name: "example",
            uri: "file:///data/example",
          },
          {
            name: "sub",
            uri: "file:///data/example/sub",
          },
        ];

        const mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever(
          {
            "/data/example": ["/data/example/hardhat.config.ts"],
          },
          {
            "/data/example": ["/data/example/contracts/one.sol"],
          }
        );

        serverState = buildServerState({ existingFolders });

        await indexWorkspaceFolders(
          serverState,
          mockWorkspaceFileRetriever,
          addedFolders
        );
      });

      it("should add only the top level workspace", () => {
        assert.deepStrictEqual(serverState.workspaceFolders, [
          {
            name: "example",
            uri: "file:///data/example",
          },
        ]);
      });

      it("should add hardhat project", () => {
        assert.deepStrictEqual(serverState.projects, {
          "/data/example": {
            basePath: "/data/example",
            configPath: "/data/example/hardhat.config.ts",
            type: "hardhat",
            remappings: [],
            workspaceFolder: {
              name: "example",
              uri: "file:///data/example",
            },
          },
        });
      });

      it("should notify the client of indexing starting", () => {
        sinon.assert.calledWithExactly(
          serverState.connection.sendNotification as any,
          "custom/indexing-start",
          {
            jobId: 1,
            path: "",
            current: 0,
            total: 0,
          }
        );
      });

      it("should notify the client of indexing finishing", () => {
        sinon.assert.calledWith(
          serverState.connection.sendNotification as any,
          "custom/indexing-file",
          {
            jobId: 1,
            path: "/data/example/contracts/one.sol",
            current: 1,
            total: 1,
          }
        );
      });
    });

    describe("adding a workspace that is nested in already indexed workspaces", () => {
      let serverState: IndexWorkspaceFoldersContext;
      let existingFolders: WorkspaceFolder[];
      let addedFolders: WorkspaceFolder[];

      before(async () => {
        existingFolders = [
          {
            name: "example",
            uri: "file:///data/example",
          },
        ];

        addedFolders = [
          {
            name: "sub",
            uri: "file:///data/example/sub",
          },
        ];

        const mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever(
          {
            "/data/example": ["/data/example/hardhat.config.ts"],
          },
          {
            "/data/example": ["/data/example/contracts/one.sol"],
          }
        );

        serverState = buildServerState({ existingFolders });

        await indexWorkspaceFolders(
          serverState,
          mockWorkspaceFileRetriever,
          addedFolders
        );
      });

      it("should not change the workspace folders", () => {
        assert.deepStrictEqual(serverState.workspaceFolders, existingFolders);
      });

      it("should not add any projects", () => {
        assert.deepStrictEqual(serverState.projects, {});
      });

      it("should not add any solidity files", () => {
        assert.deepStrictEqual(serverState.solFileIndex, {});
      });

      it("should notify the client of indexing starting", () => {
        sinon.assert.calledWithExactly(
          serverState.connection.sendNotification as any,
          "custom/indexing-start",
          {
            jobId: 1,
            path: "",
            current: 0,
            total: 0,
          }
        );
      });

      it("should notify the client of indexing finishing", () => {
        sinon.assert.calledWith(
          serverState.connection.sendNotification as any,
          "custom/indexing-file",
          {
            jobId: 1,
            path: "",
            current: 0,
            total: 0,
          }
        );
      });
    });
  });
});

function buildServerState({
  existingFolders,
}: {
  existingFolders: WorkspaceFolder[];
}): IndexWorkspaceFoldersContext {
  const mockConnection = setupMockConnection();
  const mockLogger = setupMockLogger();

  return {
    indexJobCount: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connection: mockConnection as any,
    solFileIndex: {},
    workspaceFolders: existingFolders,
    projects: {},
    logger: mockLogger,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
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
    describe("adding single workspace with no projects or sol files", () => {
      let serverState: IndexWorkspaceFoldersContext;
      let addedFolders: WorkspaceFolder[];

      before(async () => {
        addedFolders = [
          {
            name: "example",
            uri: "file///data/example",
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

      it("should notify the client of indexing", () => {
        sinon.assert.calledOnceWithExactly(
          serverState.connection.sendNotification as any,
          "custom/indexing-file",
          { path: "", current: 0, total: 0 }
        );
      });
    });

    describe("adding single workspace with projects or sol files", () => {
      let serverState: IndexWorkspaceFoldersContext;
      let addedFolders: WorkspaceFolder[];

      before(async () => {
        addedFolders = [
          {
            name: "example",
            uri: "file///data/example",
          },
        ];

        const mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever(
          ["/data/example/hardhat.config.ts"],
          ["/data/example/contracts/one.sol"]
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
            workspaceFolder: {
              name: "example",
              uri: "file///data/example",
            },
          },
        });
      });

      it("should add solidity files", () => {
        assert("/data/example/contracts/one.sol" in serverState.solFileIndex);
      });

      it("should notify the client of indexing of sol files", () => {
        sinon.assert.calledOnceWithExactly(
          serverState.connection.sendNotification as any,
          "custom/indexing-file",
          { path: "/data/example/contracts/one.sol", current: 1, total: 1 }
        );
      });
    });

    describe("adding single workspace that has been previously indexed", () => {
      let serverState: IndexWorkspaceFoldersContext;
      let existingFolders: WorkspaceFolder[];
      let addedFolders: WorkspaceFolder[];

      before(async () => {
        existingFolders = [
          {
            name: "example",
            uri: "file///data/example",
          },
        ];

        addedFolders = [
          {
            name: "example",
            uri: "file///data/example",
          },
        ];

        const mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever();

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

      it("should notify the client of indexing but with 0 files", () => {
        sinon.assert.calledOnceWithExactly(
          serverState.connection.sendNotification as any,
          "custom/indexing-file",
          { path: "", current: 0, total: 0 }
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
            uri: "file///data/example",
          },
          {
            name: "sub",
            uri: "file///data/example/sub",
          },
        ];

        const mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever(
          ["/data/example/hardhat.config.ts"],
          ["/data/example/contracts/one.sol"]
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
            uri: "file///data/example",
          },
        ]);
      });

      it("should add hardhat project", () => {
        assert.deepStrictEqual(serverState.projects, {
          "/data/example": {
            basePath: "/data/example",
            configPath: "/data/example/hardhat.config.ts",
            type: "hardhat",
            workspaceFolder: {
              name: "example",
              uri: "file///data/example",
            },
          },
        });
      });

      it("should notify the client of indexing of the sol files", () => {
        sinon.assert.calledWith(
          serverState.connection.sendNotification as any,
          "custom/indexing-file",
          { path: "/data/example/contracts/one.sol", current: 1, total: 1 }
        );
      });
    });

    describe("ignores workspaces that are nested in already indexed workspaces", () => {
      let serverState: IndexWorkspaceFoldersContext;
      let existingFolders: WorkspaceFolder[];
      let addedFolders: WorkspaceFolder[];

      before(async () => {
        existingFolders = [
          {
            name: "example",
            uri: "file///data/example",
          },
        ];

        addedFolders = [
          {
            name: "sub",
            uri: "file///data/example/sub",
          },
        ];

        const mockWorkspaceFileRetriever = setupMockWorkspaceFileRetriever(
          ["/data/example/hardhat.config.ts"],
          ["/data/example/contracts/one.sol"]
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

      it("should notify the client of indexing of the sol files", () => {
        sinon.assert.calledWith(
          serverState.connection.sendNotification as any,
          "custom/indexing-file",
          { path: "", current: 0, total: 0 }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connection: mockConnection as any,
    solFileIndex: {},
    workspaceFolders: existingFolders,
    projects: {},
    logger: mockLogger,
  };
}

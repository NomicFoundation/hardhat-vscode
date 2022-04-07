import * as path from "path";
import { assert } from "chai";
import { setupMockLogger } from "../helpers/setupMockLogger";
import { IndexFileData } from "@common/event";
import { forceToUnixStyle } from "../helpers/forceToUnixStyle";
import { indexWorkspaceFolders } from "@services/initialization/indexWorkspaceFolders";
import { Connection } from "vscode-languageserver";

describe("Analyzer", () => {
  describe("indexing", () => {
    const exampleRootPath = forceToUnixStyle(__dirname);
    let collectedData: IndexFileData[];
    let foundSolFiles: string[];

    describe("with multiple files", () => {
      beforeEach(async () => {
        collectedData = [];
        foundSolFiles = ["example1.sol", "example2.sol", "example3.sol"];

        await runIndexing(exampleRootPath, foundSolFiles, collectedData);
      });

      it("should emit an indexing event for each", () => {
        assert.equal(collectedData.length, foundSolFiles.length);
        assert.deepEqual(collectedData, [
          {
            path: path.join(__dirname, "example1.sol"),
            current: 1,
            total: 3,
          },
          {
            path: path.join(__dirname, "example2.sol"),
            current: 2,
            total: 3,
          },
          {
            path: path.join(__dirname, "example3.sol"),
            current: 3,
            total: 3,
          },
        ]);
      });
    });

    describe("with no files found", () => {
      beforeEach(async () => {
        collectedData = [];
        foundSolFiles = [];

        await runIndexing(exampleRootPath, foundSolFiles, collectedData);
      });

      it("should emit an indexing event for each", () => {
        assert.equal(collectedData.length, 1);
        assert.deepEqual(collectedData, [
          {
            path: "",
            current: 0,
            total: 0,
          },
        ]);
      });
    });
  });
});

async function runIndexing(
  rootPath: string,
  foundSolFiles: string[],
  collectedData: IndexFileData[]
) {
  const exampleWorkspaceFolders = [{ name: "example", uri: rootPath }];
  const solFileIndex = {};

  const mockLogger = setupMockLogger();

  const mockConnection = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendNotification: (eventName: string, data: any) => {
      collectedData.push(data);
    },
  } as Connection;

  const mockWorkspaceFileRetriever = {
    findFiles: async (): Promise<string[]> => {
      return [];
    },
    findSolFiles: (base: string | undefined, documentsUri: string[]) => {
      if (base !== rootPath) {
        return;
      }

      for (const foundSolFile of foundSolFiles) {
        documentsUri.push(path.join(base ?? "", foundSolFile));
      }
    },
  };

  await indexWorkspaceFolders(
    {
      workspaceFolders: exampleWorkspaceFolders,
      connection: mockConnection,
      solFileIndex,
      logger: mockLogger,
    },
    mockWorkspaceFileRetriever
  );
}

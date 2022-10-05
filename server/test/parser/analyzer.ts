/* eslint-disable @typescript-eslint/no-explicit-any */
import * as path from "path";
import { assert } from "chai";
import { IndexFileData } from "@common/event";
import { indexWorkspaceFolders } from "@services/initialization/indexWorkspaceFolders";
import { Connection } from "vscode-languageserver";
import { forceToUnixStyle } from "../helpers/forceToUnixStyle";
import { setupMockLogger } from "../helpers/setupMockLogger";

describe("Analyzer", () => {
  describe("indexing", () => {
    const exampleRootPath = forceToUnixStyle(__dirname);
    let collectedData: Array<[string, IndexFileData | undefined]>;
    let foundSolFiles: string[];

    describe("with multiple files", () => {
      beforeEach(async () => {
        collectedData = [];
        foundSolFiles = ["example1.sol", "example2.sol", "example3.sol"];

        await runIndexing(exampleRootPath, foundSolFiles, collectedData);
      });

      it("should emit an indexing-start event", () => {
        assert.equal(collectedData.length, 2);
        assert.deepEqual(collectedData, [
          ["custom/indexing-start", undefined],
          ["custom/indexing-end", undefined],
        ]);
      });
    });

    describe("with no files found", () => {
      beforeEach(async () => {
        collectedData = [];
        foundSolFiles = [];

        await runIndexing(exampleRootPath, foundSolFiles, collectedData);
      });

      it("should emit an indexing-start event", () => {
        assert.equal(collectedData.length, 2);
        assert.deepEqual(collectedData, [
          ["custom/indexing-start", undefined],
          ["custom/indexing-end", undefined],
        ]);
      });
    });
  });
});

async function runIndexing(
  rootPath: string,
  foundSolFiles: string[],
  collectedData: Array<[string, IndexFileData | undefined]>
) {
  const exampleWorkspaceFolder = { name: "example", uri: rootPath };

  const exampleProjects = {};
  const solFileIndex = {};

  const mockLogger = setupMockLogger();

  const mockConnection = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendNotification: (eventName: string, data: any) => {
      collectedData.push([eventName, data]);
    },
  } as Connection;

  const mockWorkspaceFileRetriever = {
    findFiles: async (
      baseUri: string,
      globPattern: string
    ): Promise<string[]> => {
      if (globPattern !== "**/*.sol") {
        return [];
      }

      return foundSolFiles.map((fsf) => path.join(baseUri ?? "", fsf));
    },
    readFile: async () => "",
    fileExists: async () => false,
  };

  await indexWorkspaceFolders(
    {
      indexJobCount: 0,
      connection: mockConnection,
      solFileIndex,
      projects: exampleProjects,
      logger: mockLogger,
      indexedWorkspaceFolders: [],
    } as any,
    mockWorkspaceFileRetriever,
    [exampleWorkspaceFolder]
  );
}

import * as path from "path";
import { assert } from "chai";
import { IndexFileData } from "@common/event";
import { indexWorkspaceFolders } from "@services/initialization/indexWorkspaceFolders";
import { Connection } from "vscode-languageserver";
import { HardhatProject } from "@analyzer/HardhatProject";
import { forceToUnixStyle } from "../helpers/forceToUnixStyle";
import { setupMockLogger } from "../helpers/setupMockLogger";

describe("Analyzer", () => {
  describe("indexing", () => {
    const exampleRootPath = forceToUnixStyle(__dirname);
    let collectedData: Array<[string, IndexFileData]>;
    let foundSolFiles: string[];

    describe("with multiple files", () => {
      beforeEach(async () => {
        collectedData = [];
        foundSolFiles = ["example1.sol", "example2.sol", "example3.sol"];

        await runIndexing(exampleRootPath, foundSolFiles, collectedData);
      });

      it("should emit an indexing event for each", () => {
        assert.equal(collectedData.length, 4);
        assert.deepEqual(collectedData, [
          [
            "custom/indexing-start",
            {
              jobId: 1,
              path: "",
              current: 0,
              total: 0,
            },
          ],
          [
            "custom/indexing-file",
            {
              jobId: 1,
              path: forceToUnixStyle(path.join(__dirname, "example1.sol")),
              current: 1,
              total: 3,
            },
          ],
          [
            "custom/indexing-file",
            {
              jobId: 1,
              path: forceToUnixStyle(path.join(__dirname, "example2.sol")),
              current: 2,
              total: 3,
            },
          ],
          [
            "custom/indexing-file",
            {
              jobId: 1,
              path: forceToUnixStyle(path.join(__dirname, "example3.sol")),
              current: 3,
              total: 3,
            },
          ],
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
        assert.equal(collectedData.length, 2);
        assert.deepEqual(collectedData, [
          [
            "custom/indexing-start",
            {
              jobId: 1,
              path: "",
              current: 0,
              total: 0,
            },
          ],
          [
            "custom/indexing-file",
            {
              jobId: 1,
              path: "",
              current: 0,
              total: 0,
            },
          ],
        ]);
      });
    });
  });
});

async function runIndexing(
  rootPath: string,
  foundSolFiles: string[],
  collectedData: Array<[string, IndexFileData]>
) {
  const exampleWorkspaceFolder = { name: "example", uri: rootPath };

  const exampleProjects = {
    [rootPath]: new HardhatProject(
      exampleWorkspaceFolder.uri,
      path.join(exampleWorkspaceFolder.uri, "hardhat.config.ts"),
      exampleWorkspaceFolder
    ),
  };
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
      workspaceFolders: [],
    },
    mockWorkspaceFileRetriever,
    [exampleWorkspaceFolder]
  );
}

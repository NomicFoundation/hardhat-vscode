import * as events from "events";
import * as path from "path";
import { Analyzer } from "@analyzer/index";
import { assert } from "chai";
import { setupMockLogger } from "../helpers/setupMockLogger";
import { IndexFileData } from "@common/event";
import { forceToUnixStyle } from "../helpers/forceToUnixStyle";

describe("Analyzer", () => {
  describe("indexing", () => {
    const exampleRootPath = forceToUnixStyle(__dirname);
    let collectedData: IndexFileData[];
    let foundSolFiles: string[];

    describe("with multiple files", () => {
      beforeEach(() => {
        collectedData = [];
        foundSolFiles = ["example1.sol", "example2.sol", "example3.sol"];

        const analyzer = setupAnalyzer(
          exampleRootPath,
          foundSolFiles,
          collectedData
        );

        // trigger the indexing
        analyzer.init([{ name: "example", uri: exampleRootPath }]);
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
      beforeEach(() => {
        collectedData = [];
        foundSolFiles = [];

        const analyzer = setupAnalyzer(
          exampleRootPath,
          foundSolFiles,
          collectedData
        );

        // trigger the indexing
        analyzer.init([{ name: "example", uri: exampleRootPath }]);
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

function setupAnalyzer(
  rootPath: string,
  foundSolFiles: string[],
  collectedData: IndexFileData[]
): Analyzer {
  const em = new events.EventEmitter();
  const logger = setupMockLogger();

  em.on("indexing-file", (data) => collectedData.push(data));

  const mockWorkspaceFileRetriever = {
    findSolFiles: (base: string | undefined, documentsUri: string[]) => {
      if (base !== rootPath) {
        return;
      }

      for (const foundSolFile of foundSolFiles) {
        documentsUri.push(path.join(base ?? "", foundSolFile));
      }
    },
  };

  return new Analyzer(mockWorkspaceFileRetriever, em, logger);
}

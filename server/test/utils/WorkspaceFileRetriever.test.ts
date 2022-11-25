import { assert } from "chai";
import path from "path";
import { WorkspaceFileRetriever } from "../../src/utils/WorkspaceFileRetriever";

describe("utils", () => {
  describe("WorkspaceFileRetriever", () => {
    const subject = new WorkspaceFileRetriever();

    describe("isFile()", function () {
      it("returns true when the given path is a valid file", async () => {
        assert.isTrue(
          await subject.isFile(
            path.join(__dirname, "sampleFolder", "sampleFile")
          )
        );
      });

      it("returns false when the given path exists but is not a file", async () => {
        assert.isFalse(
          await subject.isFile(path.join(__dirname, "sampleFolder"))
        );
      });

      it("returns false when the given path doesnt exist", async () => {
        assert.isFalse(
          await subject.isFile(path.join(__dirname, "nonexistent"))
        );
      });
    });
  });
});

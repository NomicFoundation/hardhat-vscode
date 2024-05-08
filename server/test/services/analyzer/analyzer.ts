import {assert} from "chai";
import * as path from "path";
import {forceToUnixStyle} from "../../helpers/forceToUnixStyle";
import {SolFileEntry} from "@analyzer/SolFileEntry";
import {Project} from "../../../out/frameworks/base/Project";
import {analyzeSolFile} from "@analyzer/analyzeSolFile";
import fs from "fs";

describe("Analyzer", () => {
  const multipleUnnamedNodes = forceToUnixStyle(
    path.join(__dirname, "testData", "MultipleUnnamedNodes.sol")
  );

  const emptyProject: Project = {
    basePath: "",
    priority: 0
  } as Project;

  it("Works with multiple unnamed nodes", async () => {
    const file = SolFileEntry.createUnloadedEntry(multipleUnnamedNodes, emptyProject);
    file.loadText(await fs.promises.readFile(file.uri, "utf-8"))
    const node = await analyzeSolFile({solFileIndex: {}}, file);
    
    assert.equal(node?.children[0]?.children[0]?.children?.length, 2);
  });
});

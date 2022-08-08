import * as fs from "fs";
import * as path from "path";
import {
  AddLicenseIdentifier,
  LICENSES,
} from "@compilerDiagnostics/diagnostics/AddLicenseIdentifier";
import { assertCodeAction } from "./asserts/assertCodeAction";

describe("Code Actions", () => {
  const codeAction = new AddLicenseIdentifier();
  let testContractText: string;

  before(async () => {
    testContractText = (
      await fs.promises.readFile(
        path.join(__dirname, "testData", "AddLicenseIdentifier.sol")
      )
    ).toString();
  });

  describe("Add license identifier", () => {
    it("adds the license identifier on top of the file", async () => {
      const diagnostic = {
        code: "1878",
        message: "SPDX license identifier not provided in source file.",
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
      };

      const expectedCodeActions = LICENSES.map((license) => ({
        title: `Add license identifier: ${license}`,
        kind: "quickfix",
        isPreferred: false,
        edits: [
          {
            newText: `// SPDX-License-Identifier: ${license}\n`,
            range: {
              start: {
                line: 0,
                character: 0,
              },
              end: {
                line: 0,
                character: 0,
              },
            },
          },
        ],
      }));

      await assertCodeAction(
        codeAction,
        testContractText,
        diagnostic,
        expectedCodeActions
      );
    });
  });
});

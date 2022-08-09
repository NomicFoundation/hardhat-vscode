import { SpecifyCompilerVersion } from "@compilerDiagnostics/diagnostics/SpecifyCompilerVersion";
import { assertCodeAction } from "./asserts/assertCodeAction";

describe("Code Actions", () => {
  const codeAction = new SpecifyCompilerVersion();
  let testContractText: string;

  describe("Specify compiler version", () => {
    const diagnostic = {
      code: "3420",
      message:
        'Source file does not specify required compiler version! Consider adding "pragma solidity ^0.8.7;"',
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
      data: {
        functionSourceLocation: {
          start: 0,
          end: 0,
        },
      },
    };

    describe("When first line is license identifier", () => {
      it("adds pragma solidity statement on the second line", async () => {
        testContractText = [
          "// SPDX-License-Identifier: GPL-3.0",
          "contract SpecifyCompilerVersion {",
          "}",
        ].join("");
        await assertCodeAction(codeAction, testContractText, diagnostic, [
          {
            title: "Add version specification",
            kind: "quickfix",
            isPreferred: true,
            edits: [
              {
                newText: "pragma solidity ^0.8.7;\n",
                range: {
                  start: {
                    line: 1,
                    character: 0,
                  },
                  end: {
                    line: 1,
                    character: 0,
                  },
                },
              },
            ],
          },
        ]);
      });
    });

    describe("When first line is a regular comment", () => {
      it("adds pragma solidity statement on the first line", async () => {
        testContractText = [
          "// My contract",
          "contract SpecifyCompilerVersion {",
          "}",
        ].join("");

        await assertCodeAction(codeAction, testContractText, diagnostic, [
          {
            title: "Add version specification",
            kind: "quickfix",
            isPreferred: true,
            edits: [
              {
                newText: "pragma solidity ^0.8.7;\n",
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
          },
        ]);
      });
    });

    describe("When first line is something else", () => {
      it("adds pragma solidity statement on the first line", async () => {
        testContractText = ["contract SpecifyCompilerVersion {", "}"].join("");

        await assertCodeAction(codeAction, testContractText, diagnostic, [
          {
            title: "Add version specification",
            kind: "quickfix",
            isPreferred: true,
            edits: [
              {
                newText: "pragma solidity ^0.8.7;\n",
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
          },
        ]);
      });
    });
  });
});

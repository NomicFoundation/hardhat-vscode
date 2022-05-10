import * as fs from "fs";
import * as path from "path";
import { AddMultiOverrideSpecifier } from "@compilerDiagnostics/diagnostics/AddMultiOverrideSpecifier";
import { assertCodeAction } from "./asserts/assertCodeAction";

describe("Code Actions", () => {
  describe("Add Multi-override Specifier", () => {
    const addOverrideSpecifier = new AddMultiOverrideSpecifier();
    let addMultiOverrideSpecifierText: string;

    before(async () => {
      addMultiOverrideSpecifierText = (
        await fs.promises.readFile(
          path.join(__dirname, "testData", "AddMultioverrideSpecifier.sol")
        )
      ).toString();
    });

    describe("single line function headers", () => {
      it("should provide option when no other keywords", () => {
        const diagnostic = {
          code: "4327",
          message:
            'Function needs to specify overridden contracts "Alpha" and "Gamma".',
          range: {
            start: { line: 44, character: 11 },
            end: { line: 44, character: 15 },
          },
          data: {
            functionSourceLocation: { start: 725, end: 742 },
          },
        };

        assertCodeAction(
          addOverrideSpecifier,
          addMultiOverrideSpecifierText,
          diagnostic,
          [
            {
              title: "Add override(...) specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: " override(Alpha, Gamma)",
                  range: {
                    start: {
                      line: 44,
                      character: 16,
                    },
                    end: {
                      line: 44,
                      character: 16,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when visibility, mutability and virtual present", () => {
        const diagnostic = {
          code: "4327",
          message:
            'Function needs to specify overridden contracts "Alpha", "Beta" and "Gamma".',
          range: {
            start: { line: 46, character: 11 },
            end: { line: 46, character: 15 },
          },
          data: {
            functionSourceLocation: { start: 746, end: 783 },
          },
        };

        assertCodeAction(
          addOverrideSpecifier,
          addMultiOverrideSpecifierText,
          diagnostic,
          [
            {
              title: "Add override(...) specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: " override(Alpha, Beta, Gamma)",
                  range: {
                    start: {
                      line: 46,
                      character: 36,
                    },
                    end: {
                      line: 46,
                      character: 36,
                    },
                  },
                },
              ],
            },
          ]
        );
      });
    });

    describe("multi-line function headers", () => {
      it("should provide option when return statement present", () => {
        const diagnostic = {
          code: "4327",
          message:
            'Function needs to specify overridden contracts "Alpha", "Beta" and "Gamma".',
          range: {
            start: { line: 48, character: 11 },
            end: { line: 48, character: 27 },
          },
          data: {
            functionSourceLocation: { start: 787, end: 881 },
          },
        };

        assertCodeAction(
          addOverrideSpecifier,
          addMultiOverrideSpecifierText,
          diagnostic,
          [
            {
              title: "Add override(...) specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: "    override(Alpha, Beta, Gamma)\n",
                  range: {
                    start: {
                      line: 51,
                      character: 0,
                    },
                    end: {
                      line: 51,
                      character: 0,
                    },
                  },
                },
              ],
            },
          ]
        );
      });
    });
  });
});

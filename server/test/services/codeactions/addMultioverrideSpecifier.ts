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
      it("should provide option when no other keywords", async () => {
        const diagnostic = {
          code: "4327",
          message:
            'Function needs to specify overridden contracts "Alpha" and "Gamma".',
          range: {
            start: { line: 50, character: 13 },
            end: { line: 50, character: 16 },
          },
          data: {
            functionSourceLocation: { start: 915, end: 932 },
          },
        };

        await assertCodeAction(
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
                      line: 50,
                      character: 18,
                    },
                    end: {
                      line: 50,
                      character: 18,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when visibility, mutability and virtual present", async () => {
        const diagnostic = {
          code: "4327",
          message:
            'Function needs to specify overridden contracts "Alpha", "Beta" and "Gamma".',
          range: {
            start: { line: 52, character: 13 },
            end: { line: 52, character: 16 },
          },
          data: {
            functionSourceLocation: { start: 938, end: 975 },
          },
        };

        await assertCodeAction(
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
                      line: 52,
                      character: 38,
                    },
                    end: {
                      line: 52,
                      character: 38,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when override is specified but not complete", async () => {
        const diagnostic = {
          code: "4327",
          message:
            'Function needs to specify overridden contracts "Beta" and "Gamma".',
          range: {
            start: { line: 54, character: 34 },
            end: { line: 54, character: 49 },
          },
          data: {
            functionSourceLocation: { start: 1034, end: 1049 },
          },
        };

        await assertCodeAction(
          addOverrideSpecifier,
          addMultiOverrideSpecifierText,
          diagnostic,
          [
            {
              title: "Add missing contracts to specifier",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: "override(Alpha, Beta, Gamma)",
                  range: {
                    start: {
                      line: 54,
                      character: 34,
                    },
                    end: {
                      line: 54,
                      character: 49,
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
      it("should provide option when return statement present", async () => {
        const diagnostic = {
          code: "4327",
          message:
            'Function needs to specify overridden contracts "Alpha", "Beta" and "Gamma".',
          range: {
            start: { line: 56, character: 13 },
            end: { line: 56, character: 29 },
          },
          data: {
            functionSourceLocation: { start: 1035, end: 1143 },
          },
        };

        await assertCodeAction(
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
                  newText: "      override(Alpha, Beta, Gamma)\n",
                  range: {
                    start: {
                      line: 59,
                      character: 0,
                    },
                    end: {
                      line: 59,
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

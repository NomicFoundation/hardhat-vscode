import * as fs from "fs";
import * as path from "path";
import { AddOverrideSpecifier } from "@compilerDiagnostics/diagnostics/AddOverrideSpecifier";
import { assertCodeAction } from "./asserts/assertCodeAction";

describe("Code Actions", () => {
  describe("Add Override Specifier", () => {
    const addOverrideSpecifier = new AddOverrideSpecifier();
    let addOverrideSpecifierText: string;

    before(async () => {
      addOverrideSpecifierText = (
        await fs.promises.readFile(
          path.join(__dirname, "testData", "AddOverrideSpecifier.sol")
        )
      ).toString();
    });

    describe("single line function headers", () => {
      it("should provide option when no visibility or mutability", async () => {
        const diagnostic = {
          code: "9456",
          message: 'Overriding function is missing "override" specifier.',
          range: {
            start: { line: 37, character: 11 },
            end: { line: 37, character: 14 },
          },
          data: {
            functionSourceLocation: { start: 674, end: 691 },
          },
        };

        await assertCodeAction(
          addOverrideSpecifier,
          addOverrideSpecifierText,
          diagnostic,
          [
            {
              title: "Add override specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: " override",
                  range: {
                    start: {
                      line: 37,
                      character: 16,
                    },
                    end: {
                      line: 37,
                      character: 16,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when visibility but no mutability", async () => {
        const diagnostic = {
          code: "9456",
          message: 'Overriding function is missing "override" specifier.',
          range: {
            start: { line: 39, character: 11 },
            end: { line: 39, character: 15 },
          },
          data: {
            functionSourceLocation: { start: 695, end: 720 },
          },
        };

        await assertCodeAction(
          addOverrideSpecifier,
          addOverrideSpecifierText,
          diagnostic,
          [
            {
              title: "Add override specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: " override",
                  range: {
                    start: {
                      line: 39,
                      character: 24,
                    },
                    end: {
                      line: 39,
                      character: 24,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when visibility and mutability present", async () => {
        const diagnostic = {
          code: "9456",
          message: 'Overriding function is missing "override" specifier.',
          range: {
            start: { line: 41, character: 11 },
            end: { line: 41, character: 14 },
          },
          data: {
            functionSourceLocation: { start: 724, end: 777 },
          },
        };

        await assertCodeAction(
          addOverrideSpecifier,
          addOverrideSpecifierText,
          diagnostic,
          [
            {
              title: "Add override specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: " override",
                  range: {
                    start: {
                      line: 41,
                      character: 28,
                    },
                    end: {
                      line: 41,
                      character: 28,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when modifier present", async () => {
        const diagnostic = {
          code: "9456",
          message: 'Overriding function is missing "override" specifier.',
          range: {
            start: { line: 43, character: 11 },
            end: { line: 43, character: 18 },
          },
          data: {
            functionSourceLocation: { start: 781, end: 825 },
          },
        };

        await assertCodeAction(
          addOverrideSpecifier,
          addOverrideSpecifierText,
          diagnostic,
          [
            {
              title: "Add override specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: " override",
                  range: {
                    start: {
                      line: 43,
                      character: 32,
                    },
                    end: {
                      line: 43,
                      character: 32,
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
      it("should provide option when no visibility or mutability", async () => {
        const diagnostic = {
          code: "9456",
          message: 'Overriding function is missing "override" specifier.',
          range: {
            start: { line: 45, character: 11 },
            end: { line: 45, character: 15 },
          },
          data: {
            functionSourceLocation: { start: 829, end: 852 },
          },
        };

        await assertCodeAction(
          addOverrideSpecifier,
          addOverrideSpecifierText,
          diagnostic,
          [
            {
              title: "Add override specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: " override",
                  range: {
                    start: {
                      line: 45,
                      character: 17,
                    },
                    end: {
                      line: 45,
                      character: 17,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when visibility but no mutability", async () => {
        const diagnostic = {
          code: "9456",
          message: 'Overriding function is missing "override" specifier.',
          range: {
            start: { line: 49, character: 11 },
            end: { line: 49, character: 15 },
          },
          data: {
            functionSourceLocation: { start: 856, end: 886 },
          },
        };

        await assertCodeAction(
          addOverrideSpecifier,
          addOverrideSpecifierText,
          diagnostic,
          [
            {
              title: "Add override specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: " override",
                  range: {
                    start: {
                      line: 49,
                      character: 24,
                    },
                    end: {
                      line: 49,
                      character: 24,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when visibility and mutability present", async () => {
        const diagnostic = {
          code: "9456",
          message: 'Overriding function is missing "override" specifier.',
          range: {
            start: { line: 53, character: 11 },
            end: { line: 53, character: 15 },
          },
          data: {
            functionSourceLocation: { start: 890, end: 954 },
          },
        };

        await assertCodeAction(
          addOverrideSpecifier,
          addOverrideSpecifierText,
          diagnostic,
          [
            {
              title: "Add override specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: "    override\n",
                  range: {
                    start: {
                      line: 56,
                      character: 0,
                    },
                    end: {
                      line: 56,
                      character: 0,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when modifier present", async () => {
        const diagnostic = {
          code: "9456",
          message: 'Overriding function is missing "override" specifier.',
          range: {
            start: { line: 60, character: 11 },
            end: { line: 60, character: 25 },
          },
          data: {
            functionSourceLocation: { start: 958, end: 1047 },
          },
        };

        await assertCodeAction(
          addOverrideSpecifier,
          addOverrideSpecifierText,
          diagnostic,
          [
            {
              title: "Add override specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: "    override\n",
                  range: {
                    start: {
                      line: 61,
                      character: 0,
                    },
                    end: {
                      line: 61,
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

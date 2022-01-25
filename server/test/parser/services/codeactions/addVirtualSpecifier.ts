import * as fs from "fs";
import * as path from "path";
import { assertCodeAction } from "./asserts/assertCodeAction";
import { AddVirtualSpecifier } from "@compilerDiagnostics/diagnostics/AddVirtualSpecifier";

describe("Code Actions", () => {
  describe("Add Virtual Specifier", () => {
    const addVirtualSpecifier = new AddVirtualSpecifier();
    let addVirtualSpecifierText: string;

    before(async () => {
      addVirtualSpecifierText = (
        await fs.promises.readFile(
          path.join(__dirname, "testData", "AddVirtualSpecifier.sol")
        )
      ).toString();
    });

    describe("single line function headers", () => {
      it("should provide option when no visibility or mutability", () => {
        const diagnostic = {
          code: "4334",
          message:
            'Trying to override non-virtual function. Did you forget to add "virtual"?',
          range: {
            start: { line: 4, character: 11 },
            end: { line: 4, character: 14 },
          },
          data: {
            functionSourceLocation: { start: 87, end: 104 },
          },
        };

        assertCodeAction(
          addVirtualSpecifier,
          addVirtualSpecifierText,
          diagnostic,
          [
            {
              title: "Add virtual specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: " virtual",
                  range: {
                    start: {
                      line: 4,
                      character: 16,
                    },
                    end: {
                      line: 4,
                      character: 16,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when visibility but no mutability", () => {
        const diagnostic = {
          code: "4334",
          message:
            'Trying to override non-virtual function. Did you forget to add "virtual"?',
          range: {
            start: { line: 6, character: 11 },
            end: { line: 6, character: 14 },
          },
          data: {
            functionSourceLocation: { start: 108, end: 132 },
          },
        };

        assertCodeAction(
          addVirtualSpecifier,
          addVirtualSpecifierText,
          diagnostic,
          [
            {
              title: "Add virtual specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: " virtual",
                  range: {
                    start: {
                      line: 6,
                      character: 23,
                    },
                    end: {
                      line: 6,
                      character: 23,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when visibility and mutability present", () => {
        const diagnostic = {
          code: "4334",
          message:
            'Trying to override non-virtual function. Did you forget to add "virtual"?',
          range: {
            start: { line: 8, character: 11 },
            end: { line: 8, character: 14 },
          },
          data: {
            functionSourceLocation: { start: 136, end: 165 },
          },
        };

        assertCodeAction(
          addVirtualSpecifier,
          addVirtualSpecifierText,
          diagnostic,
          [
            {
              title: "Add virtual specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: " virtual",
                  range: {
                    start: {
                      line: 8,
                      character: 28,
                    },
                    end: {
                      line: 8,
                      character: 28,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when modifier present", () => {
        const diagnostic = {
          code: "4334",
          message:
            'Trying to override non-virtual function. Did you forget to add "virtual"?',
          range: {
            start: { line: 10, character: 11 },
            end: { line: 10, character: 14 },
          },
          data: {
            functionSourceLocation: { start: 169, end: 209 },
          },
        };

        assertCodeAction(
          addVirtualSpecifier,
          addVirtualSpecifierText,
          diagnostic,
          [
            {
              title: "Add virtual specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: " virtual",
                  range: {
                    start: {
                      line: 10,
                      character: 28,
                    },
                    end: {
                      line: 10,
                      character: 28,
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
      it("should provide option when no visibility or mutability", () => {
        const diagnostic = {
          code: "4334",
          message:
            'Trying to override non-virtual function. Did you forget to add "virtual"?',
          range: {
            start: { line: 12, character: 11 },
            end: { line: 12, character: 15 },
          },
          data: {
            functionSourceLocation: { start: 213, end: 233 },
          },
        };

        assertCodeAction(
          addVirtualSpecifier,
          addVirtualSpecifierText,
          diagnostic,
          [
            {
              title: "Add virtual specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: " virtual",
                  range: {
                    start: {
                      line: 12,
                      character: 17,
                    },
                    end: {
                      line: 12,
                      character: 17,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when visibility but no mutability", () => {
        const diagnostic = {
          code: "4334",
          message:
            'Trying to override non-virtual function. Did you forget to add "virtual"?',
          range: {
            start: { line: 15, character: 11 },
            end: { line: 15, character: 15 },
          },
          data: {
            functionSourceLocation: { start: 237, end: 264 },
          },
        };

        assertCodeAction(
          addVirtualSpecifier,
          addVirtualSpecifierText,
          diagnostic,
          [
            {
              title: "Add virtual specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: " virtual",
                  range: {
                    start: {
                      line: 15,
                      character: 24,
                    },
                    end: {
                      line: 15,
                      character: 24,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when visibility and mutability present", () => {
        const diagnostic = {
          code: "4334",
          message:
            'Trying to override non-virtual function. Did you forget to add "virtual"?',
          range: {
            start: { line: 18, character: 11 },
            end: { line: 18, character: 15 },
          },
          data: {
            functionSourceLocation: { start: 268, end: 308 },
          },
        };

        assertCodeAction(
          addVirtualSpecifier,
          addVirtualSpecifierText,
          diagnostic,
          [
            {
              title: "Add virtual specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: "    virtual\n",
                  range: {
                    start: {
                      line: 21,
                      character: 0,
                    },
                    end: {
                      line: 21,
                      character: 0,
                    },
                  },
                },
              ],
            },
          ]
        );
      });

      it("should provide option when modifier present", () => {
        const diagnostic = {
          code: "4334",
          message:
            'Trying to override non-virtual function. Did you forget to add "virtual"?',
          range: {
            start: { line: 23, character: 11 },
            end: { line: 23, character: 25 },
          },
          data: {
            functionSourceLocation: { start: 312, end: 367 },
          },
        };

        assertCodeAction(
          addVirtualSpecifier,
          addVirtualSpecifierText,
          diagnostic,
          [
            {
              title: "Add virtual specifier to function definition",
              kind: "quickfix",
              isPreferred: true,
              edits: [
                {
                  newText: "    virtual\n",
                  range: {
                    start: {
                      line: 26,
                      character: 0,
                    },
                    end: {
                      line: 26,
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

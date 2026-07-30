/* eslint-disable @typescript-eslint/no-explicit-any */
import { OutputConverter } from "@services/validation/OutputConverter";
import { assert } from "chai";
import { CompilationDetails } from "../../../src/frameworks/base/CompilationDetails";
import { ValidationFail } from "../../../src/types";

const PROJECT_BASE_PATH = "/home/user/myProject";

function buildCompilationDetails(): CompilationDetails {
  return {
    solcVersion: "0.8.31",
    input: {
      language: "Solidity",
      sources: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "project/src/Counter.sol": { content: "contract Counter {}" },
      },
      settings: {} as any,
    } as any,
  };
}

function convert(errors: any[]): ValidationFail {
  return OutputConverter.getValidationResults(
    buildCompilationDetails(),
    { errors },
    PROJECT_BASE_PATH
  ) as ValidationFail;
}

// Regression test: ensure solc errors without a sourceLocation don't break validation
describe("output converter", () => {
  describe("compiler error without a source location", () => {
    it("should not throw", () => {
      assert.doesNotThrow(() =>
        convert([
          {
            type: "Warning",
            component: "general",
            errorCode: "3805",
            severity: "warning",
            message:
              "This is a pre-release compiler version, please do not use it in production.",
          },
        ])
      );
    });

    it("should pass the error through without inventing a source location", () => {
      const result = convert([
        {
          type: "JSONError",
          component: "general",
          severity: "error",
          message: "Invalid EVM version requested.",
        },
      ]);

      assert.strictEqual(result.status, "VALIDATION_FAIL");
      assert.lengthOf(result.errors, 1);
      assert.strictEqual(
        result.errors[0].message,
        "Invalid EVM version requested."
      );
      assert.isUndefined(result.errors[0].sourceLocation?.file);
    });

    it("should not discard sibling errors that do have a source location", () => {
      const result = convert([
        {
          type: "Warning",
          component: "general",
          errorCode: "3805",
          severity: "warning",
          message: "This is a pre-release compiler version",
        },
        {
          type: "Warning",
          severity: "warning",
          message: "Unused local variable.",
          sourceLocation: {
            file: "project/src/Counter.sol",
            start: 92,
            end: 98,
          },
        },
      ]);

      assert.lengthOf(result.errors, 2);

      // The located sibling must survive AND still be normalized.
      const located = result.errors[1];
      assert.strictEqual(located.message, "Unused local variable.");
      assert.deepStrictEqual(located.sourceLocation, {
        file: "src/Counter.sol",
        start: 92,
        end: 98,
      });
    });
  });

  describe("compiler error with a source location but no file", () => {
    it("should not throw and should leave file undefined", () => {
      let result!: ValidationFail;

      assert.doesNotThrow(() => {
        result = convert([
          {
            type: "Warning",
            severity: "warning",
            message: "Something without a file",
            sourceLocation: { start: 1, end: 2 },
          },
        ]);
      });

      assert.isUndefined(result.errors[0].sourceLocation?.file);
      assert.strictEqual(result.errors[0].sourceLocation?.start, 1);
    });
  });

  describe("compiler error with a source location", () => {
    it("should strip the internal project/ prefix", () => {
      const result = convert([
        {
          type: "ParserError",
          severity: "error",
          message: "Expected ';' but got '}'",
          sourceLocation: {
            file: "project/src/Counter.sol",
            start: 10,
            end: 11,
          },
        },
      ]);

      assert.deepStrictEqual(result.errors[0].sourceLocation, {
        file: "src/Counter.sol",
        start: 10,
        end: 11,
      });
    });
  });
});

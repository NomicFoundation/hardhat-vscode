import { UninitializedImmutable } from "@compilerDiagnostics/diagnostics/UninitializedImmutable";
import { expect } from "chai";
import { TextDocument } from "vscode-languageserver-textdocument";

describe("UninitializedImmutable Compiler Diagnostic", () => {
  it("should return constructor and uninitialized immutable ranges", () => {
    const diagnostic = new UninitializedImmutable();
    const fakeTextDocument = TextDocument.create(
      "test.sol",
      "solidity",
      1,
      `
pragma solidity ^0.8.0; 
contract Test { 
  uint256 public immutable myVar; 
  uint256 public immutable myVar2 = 1; 
  constructor() {} 
}`
    );

    const fakeError = {
      errorCode: "2658",
      message:
        "Construction control flow ends without initializing all immutable state variables.",
      sourceLocation: { start: 0, end: 100 },
    };

    const result = diagnostic.fromHardhatCompilerError(
      fakeTextDocument,
      fakeError as never
    );

    expect(Array.isArray(result)).to.equal(true);
    if (Array.isArray(result)) {
      expect(result.length).to.equal(2);

      // Constructor range
      const constructorResult = result.find((r) => r.range.start.line === 5);
      expect(constructorResult).to.not.equal(undefined);

      // Uninitialized immutable range
      const immutableResult = result.find((r) => r.range.start.line === 3);
      expect(immutableResult).to.not.equal(undefined);
    }
  });
});

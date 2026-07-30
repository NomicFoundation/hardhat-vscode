import { UninitializedImmutable } from "@compilerDiagnostics/diagnostics/UninitializedImmutable";
import { expect } from "chai";
import { Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { SolcError } from "../../../src/types";

const MESSAGE =
  "Construction control flow ends without initializing all immutable state variables.";

const START_MARKER = "/*[*/";
const END_MARKER = "/*]*/";

/**
 * Builds the error the way solc reports 2658: the source location spans the
 * whole contract definition, delimited in the fixtures below by the markers.
 *
 * The markers are swapped for equal-length whitespace, so every offset, line
 * and column in the fixture stays exactly where it was written.
 */
function buildError(text: string): { error: SolcError; source: string } {
  const start = text.indexOf(START_MARKER);
  const end = text.indexOf(END_MARKER);

  if (start === -1 || end === -1) {
    throw new Error("fixture is missing its contract markers");
  }

  const source = text
    .replace(START_MARKER, " ".repeat(START_MARKER.length))
    .replace(END_MARKER, " ".repeat(END_MARKER.length));

  return {
    source,
    error: {
      component: "general",
      errorCode: "2658",
      formattedMessage: MESSAGE,
      message: MESSAGE,
      severity: "error",
      sourceLocation: { file: "test.sol", start, end: end + END_MARKER.length },
      type: "DeclarationError",
    } as SolcError,
  };
}

function run(text: string): { covered: string[]; diagnostics: Diagnostic[] } {
  const { source, error } = buildError(text);

  const document = TextDocument.create("test.sol", "solidity", 1, source);
  const result = new UninitializedImmutable().fromHardhatCompilerError(
    document,
    error
  );

  const diagnostics = Array.isArray(result) ? result : [result];

  // Each diagnostic is labelled by the line its range starts on. That keeps the
  // assertions readable, independent of the fixture's exact line numbering, and
  // - deliberately - independent of where the range *ends*, so that only the
  // "range boundaries" test below fails when the end column is off.
  const lines = source.split("\n");
  const covered = diagnostics.map((d) => lines[d.range.start.line].trim());

  return { covered, diagnostics };
}

describe("UninitializedImmutable Compiler Diagnostic", () => {
  describe("a single uninitialized immutable", () => {
    it("underlines the variable and the constructor", () => {
      const { covered } = run(`
pragma solidity ^0.8.0;
/*[*/contract Test {
  uint256 public immutable myVar;
  uint256 public immutable myVar2 = 1;

  constructor() {}
}/*]*/
`);

      expect(covered).to.have.members([
        "uint256 public immutable myVar;",
        "constructor() {}",
      ]);
    });
  });

  describe("an immutable that IS assigned in the constructor", () => {
    it("underlines only the one solc is complaining about", () => {
      const { covered } = run(`
pragma solidity ^0.8.0;
/*[*/contract Test {
  uint256 public immutable a;
  uint256 public immutable b;
  uint256 public immutable c;

  constructor(uint256 _a) {
    a = _a;
    b = _a * 2;
  }
}/*]*/
`);

      // `a` and `b` are initialized in the constructor body, so `c` is the only
      // uninitialized one. Telling them apart means looking at what the
      // constructor assigns, not just at whether the declaration has an inline
      // initializer.
      expect(covered).to.include("uint256 public immutable c;");
      expect(covered).to.not.include("uint256 public immutable a;");
      expect(covered).to.not.include("uint256 public immutable b;");
    });
  });

  describe("several contracts in one file", () => {
    const fixture = `
pragma solidity ^0.8.0;
/*[*/contract Bad {
  uint256 public immutable broken;

  constructor() {}
}/*]*/

contract Good {
  uint256 public immutable ok;

  constructor(uint256 _ok) {
    ok = _ok;
  }
}
`;

    it("ignores contracts the error is not about", () => {
      const { covered } = run(fixture);

      // `Good` compiles fine - it just has no *inline* initializer.
      expect(covered).to.include("uint256 public immutable broken;");
      expect(covered).to.not.include("uint256 public immutable ok;");
    });

    it("underlines the constructor of the offending contract", () => {
      const { covered } = run(fixture);

      // Only one constructor is kept for the whole file, so the last one wins
      // unless the error's sourceLocation is used to narrow the search.
      expect(covered).to.include("constructor() {}");
      expect(covered).to.not.include("constructor(uint256 _ok) {");
    });
  });

  describe("no constructor at all", () => {
    it("underlines just the variable", () => {
      const { covered } = run(`
pragma solidity ^0.8.0;
/*[*/contract Test {
  uint256 public immutable myVar;
}/*]*/
`);

      expect(covered).to.deep.equal(["uint256 public immutable myVar;"]);
    });
  });

  describe("non-immutable state variables", () => {
    it("are left alone", () => {
      const { covered } = run(`
pragma solidity ^0.8.0;
/*[*/contract Test {
  uint256 public plain;
  uint256 public constant CONST = 1;
  uint256 public immutable myVar;

  constructor() {}
}/*]*/
`);

      expect(covered).to.have.members([
        "uint256 public immutable myVar;",
        "constructor() {}",
      ]);
    });
  });

  describe("range boundaries", () => {
    it("includes the last character of the underlined text", () => {
      const { diagnostics } = run(`
pragma solidity ^0.8.0;
/*[*/contract Test {
  uint256 public immutable myVar;

  constructor() {}
}/*]*/
`);

      const constructorDiagnostic = diagnostics.find(
        (d) => d.range.start.line === 5
      );

      expect(constructorDiagnostic).to.not.equal(undefined);

      // `  constructor() {}` - the closing brace sits at column 17, so an
      // exclusive LSP end has to be 18. @solidity-parser's `loc.end.column` is
      // 0-based and inclusive of the last character, so it needs a +1 when
      // converted into a Range.
      expect(constructorDiagnostic?.range.end.character).to.equal(18);
    });
  });

  describe("unparseable source", () => {
    it("falls back to the single whole-contract diagnostic", () => {
      // An unterminated string literal is one of the few things that still
      // throws with `tolerant: true`, so it exercises the catch branch.
      const { diagnostics } = run(`
pragma solidity ^0.8.0;
/*[*/contract Test {
  string public name = "unterminated;
  uint256 public immutable myVar;

  constructor() {}
}/*]*/
`);

      expect(diagnostics).to.have.length(1);
      expect(diagnostics[0].message).to.equal(MESSAGE);
    });
  });

  // Skipped: `DiagnosticConverter.convertErrors` hands over the document that
  // changed, but errors can belong to imported files, so the handler parses the
  // wrong text and files the resulting ranges under the other file's path. This
  // predates the PR - `passThroughConversion` mis-resolves offsets the same way
  // - and fixing it means changing the converter rather than this diagnostic.
  // See local/proj/02_immutable_2658 case E for a live reproduction.
  describe.skip("an error reported against an imported file", () => {
    it("computes ranges from the file the error belongs to", () => {
      // Intentionally empty.
    });
  });
});

import {
  DiagnosticSeverity,
  TextDocument,
  Diagnostic,
  Range,
} from "@common/types";
import { convertHardhatErrorToDiagnostic } from "@services/validation/convertHardhatErrorToDiagnostic";
import { assert } from "chai";

type ErrorDescription = {
  number: number;
  message: string;
  title: string;
  description: string;
  shouldBeReported: false;
};

describe("validation", () => {
  describe("convertHardhatErrorToDiagnostic", () => {
    const exampleUri = "/example";

    describe("404 - Imported file not found", () => {
      it("should convert to a diagnostic", () => {
        assertConversionToDiagnostic(
          "./nonexistant.sol",
          {
            number: 404,
            message: "File %imported%, imported from %from%, not found.",
            title: "Imported file not found",
            description: `One of your source files imported a nonexistent file.
      Please double check your imports.`,
            shouldBeReported: false,
          },
          {
            message: "Imported file not found",
            range: {
              start: { line: 0, character: 8 },
              end: { line: 0, character: 25 },
            },
          }
        );
      });
    });

    describe("405 - Invalid import: use / instead of \\", () => {
      it("should convert to a diagnostic", () => {
        assertConversionToDiagnostic(
          ".\\access\\Auth.sol",
          {
            number: 405,
            message:
              "Invalid import %imported% from %from%. Imports must use / instead of \\, even in Windows",
            title: "Invalid import: use / instead of \\",
            description: `A Solidity file is trying to import another file via relative path and is using backslashes (\\\\) instead of slashes (/).
      
You must always use slashes (/) in Solidity imports.`,
            shouldBeReported: false,
          },
          {
            message: "Invalid import: use / instead of \\",
            range: {
              start: { line: 0, character: 8 },
              end: { line: 0, character: 25 },
            },
          }
        );
      });
    });

    describe("406 - trying to import a file using an unsupported protocol", () => {
      it("should convert to a diagnostic", () => {
        const errorDescription = `A Solidity file is trying to import a file using an unsupported protocol, like http.

You can only import files that are available locally or installed through npm.`;

        assertConversionToDiagnostic(
          "ipfs://abbiji",
          {
            number: 406,
            message:
              "Invalid import %imported% from %from%. Hardhat doesn't support imports via %protocol%.",
            title: "Invalid import: trying to use an unsupported protocol",
            description: errorDescription,
            shouldBeReported: false,
          },
          {
            message: "Invalid import: trying to use an unsupported protocol",
            range: {
              start: { line: 0, character: 8 },
              end: { line: 0, character: 21 },
            },
          }
        );
      });
    });

    describe("407 - Invalid import: absolute paths unsupported", () => {
      it("should convert to a diagnostic", () => {
        assertConversionToDiagnostic(
          "/Users/example/file.sol",
          {
            number: 407,
            message:
              "Invalid import %imported% from %from%. Hardhat doesn't support imports with absolute paths.",
            title: "Invalid import: absolute paths unsupported",
            description: `A Solidity file is trying to import a file using its absolute path.
      
This is not supported, as it would lead to hard-to-reproduce compilations.`,
            shouldBeReported: false,
          },
          {
            message: "Invalid import: absolute paths unsupported",
            range: {
              start: { line: 0, character: 8 },
              end: { line: 0, character: 31 },
            },
          }
        );
      });
    });

    describe("408 - Illegal Solidity import", () => {
      it("should convert to a diagnostic", () => {
        const errorDescription = `A Solidity file is trying to import a file that is outside of the project.
      
This is not supported by Hardhat.`;

        assertConversionToDiagnostic(
          "../../../../outside.sol",
          {
            number: 408,
            message:
              "Invalid import %imported% from %from%. The file being imported is outside of the project",
            title: "Invalid import: file outside of the project",
            description: errorDescription,
            shouldBeReported: false,
          },
          {
            message: "Invalid import: file outside of the project",
            range: {
              start: { line: 0, character: 8 },
              end: { line: 0, character: 31 },
            },
          }
        );
      });
    });

    describe("409 - Invalid import: wrong file casing", () => {
      it("should convert to a diagnostic", () => {
        const errorDescription = `A Solidity file is trying to import a file but its source name casing was wrong.
      
Hardhat's compiler is case sensitive to ensure projects are portable across different operating systems.`;

        assertConversionToDiagnostic(
          "./WRONGCASE.sol",
          {
            number: 409,
            message:
              "Trying to import %imported% from %from%, but it has an incorrect casing.",
            title: "Invalid import: wrong file casing",
            description: errorDescription,
            shouldBeReported: false,
          },
          {
            message: "Invalid import: wrong file casing",
            range: {
              start: { line: 0, character: 8 },
              end: { line: 0, character: 23 },
            },
          }
        );
      });
    });

    describe("unhandled - an unknown hardhat error", () => {
      const fileText = `
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "1123453";`;

      const unknownErrorDescription = "Unknown text about the error";

      let diagnostic: Diagnostic | null;

      beforeEach(() => {
        const document = TextDocument.create(
          exampleUri,
          "solidity",
          0,
          fileText
        );

        diagnostic = convertHardhatErrorToDiagnostic(document, {
          errorDescriptor: {
            number: 999,
            title: "unknown - some unknown error",
            description: unknownErrorDescription,
          },
        });
      });

      it("should not convert to a diagnostic", () => {
        assert.deepStrictEqual(diagnostic, null);
      });
    });
  });
});

function assertConversionToDiagnostic(
  importLine: string,
  errorDescription: ErrorDescription,
  expected: {
    message: string;
    range: Range;
  }
) {
  const exampleUri = "/example";

  const fileText = `import "${importLine}";`;

  const document = TextDocument.create(exampleUri, "solidity", 0, fileText);

  const diagnostic: Diagnostic | null = convertHardhatErrorToDiagnostic(
    document,
    {
      errorDescriptor: errorDescription,
      messageArguments: { imported: importLine },
    }
  );

  if (diagnostic === null) {
    assert.fail("No diagnostic returned");
  }

  assert.deepStrictEqual(diagnostic, {
    severity: DiagnosticSeverity.Error,
    code: errorDescription.number,
    source: "hardhat",
    ...expected,
  });
}

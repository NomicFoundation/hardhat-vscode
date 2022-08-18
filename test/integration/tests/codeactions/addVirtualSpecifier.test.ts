import * as vscode from "vscode";
import { checkOrWaitDiagnostic } from "../../helpers/assertions";
import { getDocUri } from "../../helpers/docPaths";
import {
  applyQuickfix,
  compareWithFile,
  goToPosition,
  openFileInEditor,
  openQuickfixMenu,
} from "../../helpers/editor";

suite("codeactions - add virtual specifier", function () {
  this.timeout(20000);

  test("add virtual specifier on multiple occurrences", async () => {
    const uri = getDocUri(__dirname, "./AddVirtualSpecifier.sol");
    const editor = await openFileInEditor(uri);

    const diagPositions = [
      [
        [4, 11],
        [4, 14],
      ],
      [
        [6, 11],
        [6, 14],
      ],
      [
        [8, 11],
        [8, 14],
      ],
      [
        [10, 11],
        [10, 14],
      ],
      [
        [12, 11],
        [12, 15],
      ],
      [
        [15, 11],
        [15, 15],
      ],
      [
        [18, 11],
        [18, 15],
      ],
      [
        [24, 11],
        [24, 15],
      ],
    ];

    for (const diagPosition of diagPositions) {
      const diagStart = new vscode.Position(
        diagPosition[0][0],
        diagPosition[0][1]
      );
      const diagEnd = new vscode.Position(
        diagPosition[1][0],
        diagPosition[1][1]
      );
      await checkOrWaitDiagnostic(
        uri,
        new vscode.Range(diagStart, diagEnd),
        vscode.DiagnosticSeverity.Error,
        "solidity",
        "Trying to override non-virtual function"
      );

      goToPosition(editor, diagStart);

      await openQuickfixMenu();
      await applyQuickfix(0);
    }

    compareWithFile(
      editor,
      getDocUri(__dirname, "./AddVirtualSpecifier_fixed.sol")
    );
  });
});

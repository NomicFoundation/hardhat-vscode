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

suite("codeactions - add override specifier", function () {
  this.timeout(20000);

  test("add override on multiple occurrences", async () => {
    const uri = getDocUri(__dirname, "./AddOverrideSpecifier.sol");
    const editor = await openFileInEditor(uri);

    const diagPositions = [
      [
        [37, 11],
        [37, 14],
      ],
      [
        [39, 11],
        [39, 15],
      ],
      [
        [41, 11],
        [41, 14],
      ],
      [
        [43, 11],
        [43, 18],
      ],
      [
        [45, 11],
        [45, 15],
      ],
      [
        [49, 11],
        [49, 15],
      ],
      [
        [53, 11],
        [53, 15],
      ],
      [
        [60, 11],
        [60, 25],
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
        'Overriding function is missing "override" specifier'
      );

      goToPosition(editor, diagStart);

      await openQuickfixMenu();
      await applyQuickfix(0);
    }

    compareWithFile(
      editor,
      getDocUri(__dirname, "./AddOverrideSpecifier_fixed.sol")
    );
  });
});

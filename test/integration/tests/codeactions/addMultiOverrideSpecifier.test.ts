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

suite("codeactions - add multi override specifier", function () {
  this.timeout(20000);

  test("add multi override on multiple occurrences", async () => {
    const uri = getDocUri(__dirname, "./AddMultioverrideSpecifier.sol");
    const editor = await openFileInEditor(uri);

    const diagPositions = [
      [
        [50, 13],
        [50, 16],
      ],
      [
        [52, 13],
        [52, 16],
      ],
      [
        [54, 34],
        [54, 49],
      ],
      [
        [56, 13],
        [56, 29],
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
        "needs to specify overridden contracts"
      );

      goToPosition(editor, diagStart);

      await openQuickfixMenu();
      await applyQuickfix(0);
    }

    compareWithFile(
      editor,
      getDocUri(__dirname, "./AddMultioverrideSpecifier_fixed.sol")
    );
  });
});

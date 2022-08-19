import * as vscode from "vscode";
import { checkOrWaitDiagnostic } from "../../helpers/assertions";
import { getDocPath, getDocUri } from "../../helpers/docPaths";
import {
  applyQuickfix,
  compareWithFile,
  goToPosition,
  openFileInEditor,
  openQuickfixMenu,
} from "../../helpers/editor";

suite("codeactions - add multi override specifier", function () {
  this.timeout(30000);

  test("add multi override on multiple occurrences", async () => {
    const uri = getDocUri(__dirname, "./AddMultioverrideSpecifier.sol");
    const editor = await openFileInEditor(uri);

    const diagPositions = [
      [
        [20, 11],
        [20, 14],
      ],
      [
        [22, 32],
        [22, 47],
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
      getDocPath(__dirname, "./AddMultioverrideSpecifier_fixed.sol")
    );
  });
});

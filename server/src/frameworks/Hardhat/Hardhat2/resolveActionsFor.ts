import { visit } from "@solidity-parser/parser";
import {
  ASTNode,
  ContractDefinition,
} from "@solidity-parser/parser/dist/src/ast-types";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CodeAction,
  Diagnostic,
  Position,
  TextEdit,
} from "vscode-languageserver-types";
import { normalizeParserPosition } from "../../../parser/utils";
import { ServerState } from "../../../types";
import { decodeUriAndRemoveFilePrefix } from "../../../utils";

export function resolveActionsFor(
  serverState: ServerState,
  diagnostic: Diagnostic,
  document: TextDocument,
  uri: string
): CodeAction[] {
  const codeActions: CodeAction[] = [];
  const errorText = document.getText(diagnostic.range);

  if (diagnostic.code === "7576" && errorText === "console") {
    const filePath = decodeUriAndRemoveFilePrefix(uri);
    const solFileEntry = serverState.solFileIndex[filePath];
    const ast = solFileEntry?.ast;

    if (ast !== undefined) {
      const insertPosition = getImportInsertPosition(ast);
      codeActions.push({
        title: "Add import from 'hardhat'",
        kind: "quickfix",
        isPreferred: true,
        edit: {
          changes: {
            [uri]: [
              TextEdit.insert(
                insertPosition,
                'import "hardhat/console.sol";\n\n'
              ),
            ],
          },
        },
      });
    }
  }

  return codeActions;
}

function getImportInsertPosition(ast: ASTNode): Position {
  let firstContractDefinition!: ContractDefinition;

  visit(ast, {
    ContractDefinition: (node) => {
      firstContractDefinition = firstContractDefinition ?? node;
    },
  });

  const loc = firstContractDefinition?.loc;

  if (loc !== undefined) {
    return normalizeParserPosition(loc.start);
  } else {
    return { character: 0, line: 0 };
  }
}

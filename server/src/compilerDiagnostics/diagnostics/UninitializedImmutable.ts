import * as parser from "@solidity-parser/parser";
import type * as ast from "@solidity-parser/parser/dist/src/ast-types";
import { CodeAction, Diagnostic, Range } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ResolveActionsContext } from "../types";
import { SolcError, ServerState } from "../../types";
import { passThroughConversion } from "../conversions/passThroughConversion";

export class UninitializedImmutable {
  public code = "2658";
  public blocks = [];

  public fromHardhatCompilerError(
    document: TextDocument,
    error: SolcError
  ): Diagnostic | Diagnostic[] {
    const defaultDiagnostic = passThroughConversion(document, error);

    try {
      const text = document.getText();
      const ast = parser.parse(text, { loc: true, tolerant: true });

      const diagnostics: Diagnostic[] = [];

      let constructorRange: Range | null = null;
      const uninitializedImmutablesRanges: Range[] = [];

      // Find constructor and uninitialized immutable variables within the contract AST
      parser.visit(ast, {
        StateVariableDeclaration: (node: ast.StateVariableDeclaration) => {
          if (
            node.variables === null ||
            node.variables === undefined ||
            node.variables.length === 0
          )
            return;
          for (const variable of node.variables) {
            if (variable.isDeclaredConst === true) continue; // Not immutable
            if (
              variable.isImmutable === true &&
              (node.initialValue === null || node.initialValue === undefined)
            ) {
              if (variable.loc) {
                uninitializedImmutablesRanges.push(
                  Range.create(
                    variable.loc.start.line - 1,
                    variable.loc.start.column,
                    variable.loc.end.line - 1,
                    variable.loc.end.column
                  )
                );
              }
            }
          }
        },
        FunctionDefinition: (node: ast.FunctionDefinition) => {
          if (node.isConstructor && node.loc) {
            constructorRange = Range.create(
              node.loc.start.line - 1,
              node.loc.start.column,
              node.loc.end.line - 1,
              node.loc.end.column
            );
          }
        },
      });

      if (constructorRange !== null) {
        diagnostics.push({
          ...defaultDiagnostic,
          range: constructorRange,
        });
      }

      for (const range of uninitializedImmutablesRanges) {
        diagnostics.push({
          ...defaultDiagnostic,
          range,
        });
      }

      if (diagnostics.length > 0) {
        return diagnostics;
      }

      return defaultDiagnostic;
    } catch (e) {
      return defaultDiagnostic;
    }
  }

  public resolveActions(
    _serverState: ServerState,
    _diagnostic: Diagnostic,
    _context: ResolveActionsContext
  ): CodeAction[] {
    return [];
  }
}

import * as parser from "@solidity-parser/parser";
import type * as ast from "@solidity-parser/parser/dist/src/ast-types";
import { CodeAction, Diagnostic, Range } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ResolveActionsContext } from "../types";
import { SolcError, ServerState } from "../../types";
import { toUnixStyle } from "../../utils";
import { passThroughConversion } from "../conversions/passThroughConversion";
import { byteOffsetToStringIndex } from "../conversions/byteOffsetToStringIndex";

/**
 * The last two of the jsparser type guards. The Slang migration removed the
 * analyzer they lived in, and this diagnostic is the only thing left that
 * walks a `@solidity-parser` AST.
 */
function isFunctionDefinition(
  node: ast.BaseASTNode
): node is ast.FunctionDefinition {
  return node.type === "FunctionDefinition";
}

function isStateVariableDeclaration(
  node: ast.BaseASTNode
): node is ast.StateVariableDeclaration {
  return node.type === "StateVariableDeclaration";
}

/**
 * solc reports 2658 ("Construction control flow ends without initializing all
 * immutable state variables") against the whole contract definition, which
 * paints the entire contract red. This narrows it down to the immutables that
 * are actually left uninitialized, plus the constructor that should have
 * initialized them.
 */
export class UninitializedImmutable {
  public code = "2658";
  public blocks = [];

  public fromHardhatCompilerError(
    document: TextDocument,
    error: SolcError
  ): Diagnostic | Diagnostic[] {
    const defaultDiagnostic = passThroughConversion(document, error);

    // convertErrors hands over the document that changed, which is not always
    // the file the error belongs to. Reading another file's AST would put the
    // ranges on whatever happens to sit at those offsets here.
    if (!this._errorBelongsTo(document, error)) {
      return defaultDiagnostic;
    }

    try {
      const text = document.getText();

      const sourceUnit = parser.parse(text, {
        loc: true,
        range: true,
        tolerant: true,
      });

      const contract = this._findErroringContract(sourceUnit, text, error);

      if (contract === null) {
        return defaultDiagnostic;
      }

      const constructorNode = this._findConstructor(contract);

      // An immutable can be given its value either inline or in the
      // constructor body, so both have to be taken into account before calling
      // one uninitialized.
      const assignedInConstructor =
        constructorNode === null
          ? new Set<string>()
          : this._collectAssignedNames(constructorNode);

      const ranges: Range[] = [];

      for (const node of contract.subNodes) {
        if (!isStateVariableDeclaration(node)) {
          continue;
        }

        if (node.initialValue !== null && node.initialValue !== undefined) {
          continue;
        }

        for (const variable of node.variables) {
          if (variable.isImmutable !== true) {
            continue;
          }

          if (
            variable.name !== null &&
            assignedInConstructor.has(variable.name)
          ) {
            continue;
          }

          const range = this._toRange(document, variable);

          if (range !== null) {
            ranges.push(range);
          }
        }
      }

      // Nothing identified means our reading of the contract disagrees with
      // solc's. Report the original error rather than swallow it.
      if (ranges.length === 0) {
        return defaultDiagnostic;
      }

      if (constructorNode !== null) {
        const constructorRange = this._toRange(document, constructorNode);

        if (constructorRange !== null) {
          ranges.push(constructorRange);
        }
      }

      return ranges.map((range) => ({ ...defaultDiagnostic, range }));
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

  /**
   * Whether the error was reported against the document being parsed. Paths are
   * compared by suffix because solc reports them relative to the project root.
   */
  private _errorBelongsTo(document: TextDocument, error: SolcError): boolean {
    if (error.sourceLocation === undefined) {
      return false;
    }

    const documentPath = toUnixStyle(decodeURIComponent(document.uri));

    return documentPath.endsWith(toUnixStyle(error.sourceLocation.file));
  }

  /**
   * A file can hold several contracts, only one of which the error is about,
   * so the error's own source location decides which one to look at. Finding
   * no contract is a valid answer - the caller then reports the error as solc
   * framed it.
   */
  private _findErroringContract(
    sourceUnit: ast.SourceUnit,
    text: string,
    error: SolcError
  ): ast.ContractDefinition | null {
    if (error.sourceLocation === undefined) {
      return null;
    }

    const start = byteOffsetToStringIndex(text, error.sourceLocation.start);

    const contracts: ast.ContractDefinition[] = [];

    parser.visit(sourceUnit, {
      ContractDefinition: (node) => {
        if (node.range !== undefined) {
          contracts.push(node);
        }
      },
    });

    // `range` ends on the contract's last character, not past it.
    const containing = contracts.find(
      (contract) => contract.range![0] <= start && start <= contract.range![1]
    );

    return containing ?? null;
  }

  private _findConstructor(
    contract: ast.ContractDefinition
  ): ast.FunctionDefinition | null {
    for (const node of contract.subNodes) {
      if (isFunctionDefinition(node) && node.isConstructor === true) {
        return node;
      }
    }

    return null;
  }

  /**
   * Names assigned to somewhere inside the constructor. Immutables only accept
   * plain assignment, so `=` is the only operator worth looking at.
   *
   * A local variable shadowing an immutable would be counted here as well. That
   * leaves the immutable looking initialized, no range is collected for it, and
   * the whole-contract diagnostic is reported instead - the same thing the user
   * saw before this diagnostic existed.
   */
  private _collectAssignedNames(
    constructorNode: ast.FunctionDefinition
  ): Set<string> {
    const names = new Set<string>();

    const record = (node: ast.Expression) => {
      if (node.type === "Identifier") {
        names.add(node.name);
      } else if (node.type === "TupleExpression") {
        for (const component of node.components) {
          if (component !== null) {
            record(component as ast.Expression);
          }
        }
      }
    };

    parser.visit(constructorNode, {
      BinaryOperation: (node) => {
        if (node.operator === "=") {
          record(node.left);
        }
      },
    });

    return names;
  }

  /**
   * `range` is a pair of character offsets whose end is inclusive, while an LSP
   * range ends one past its last character.
   */
  private _toRange(
    document: TextDocument,
    node: ast.BaseASTNode
  ): Range | null {
    if (node.range === undefined) {
      return null;
    }

    return Range.create(
      document.positionAt(node.range[0]),
      document.positionAt(node.range[1] + 1)
    );
  }
}

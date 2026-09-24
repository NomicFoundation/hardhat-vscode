/* eslint-disable no-template-curly-in-string */
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with {
  "resolution-mode": "import",
};
import type {
  Cursor,
  NonterminalNode,
  TerminalKindExtensions as TerminalKindExtensionsType,
} from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import type { Definition } from "@nomicfoundation/slang/bindings" with {
  "resolution-mode": "import",
};
import {
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  CompletionParams,
  MarkupKind,
} from "vscode-languageserver/node";
import * as fs from "fs";
import * as path from "path";
import { ServerState } from "../../types";
import { toUnixStyle } from "../../utils";
import { onCommand } from "../../utils/onCommand";
import {
  findEnclosingContractAtPosition,
  getCursorAtPosition,
  getInheritedContracts,
  getSlangAst,
  getSlangCst,
} from "../../parser/slangHelpers";
import { globalVariables, defaultCompletion } from "./defaultCompletion";
import { arrayCompletions } from "./arrayCompletions";

// Module-level cache populated by `await getSlangAst()` at the entry of
// completion so the recursive helpers below can read it synchronously.
type SlangAstModule = Awaited<ReturnType<typeof getSlangAst>>;
let slangAst: SlangAstModule | undefined;

export const onCompletion = (serverState: ServerState) => {
  return onCommand<CompletionParams, CompletionList | null>(
    serverState,
    (unit, uri, params) => doComplete(serverState, unit, uri, params),
    null
  );
};

/**
 * Set of NonterminalKind values that represent scope-introducing definitions.
 * Used for walking up the CST to collect definitions visible at a position.
 */
const DEFINITION_KINDS = new Set([
  "ContractDefinition",
  "InterfaceDefinition",
  "LibraryDefinition",
  "StructDefinition",
  "EnumDefinition",
  "FunctionDefinition",
  "ConstructorDefinition",
  "ModifierDefinition",
  "EventDefinition",
  "ErrorDefinition",
  "StateVariableDefinition",
  "ConstantDefinition",
  "FallbackFunctionDefinition",
  "ReceiveFunctionDefinition",
  "UnnamedFunctionDefinition",
  "UserDefinedValueTypeDefinition",
]);

/**
 * NonterminalKind values that represent scope containers.
 * When walking up, we enumerate children of these nodes to find definitions.
 */
const SCOPE_KINDS = new Set([
  "SourceUnit",
  "ContractDefinition",
  "InterfaceDefinition",
  "LibraryDefinition",
  "FunctionDefinition",
  "ConstructorDefinition",
  "ModifierDefinition",
  "FallbackFunctionDefinition",
  "ReceiveFunctionDefinition",
  "UnnamedFunctionDefinition",
  "Block",
  "UncheckedBlock",
]);

/**
 * Map from NonterminalKind to CompletionItemKind for building completion items.
 */
function completionKindForNonterminal(kind: string): CompletionItemKind {
  switch (kind) {
    case "ContractDefinition":
      return CompletionItemKind.Class;
    case "InterfaceDefinition":
      return CompletionItemKind.Interface;
    case "LibraryDefinition":
      return CompletionItemKind.Module;
    case "StructDefinition":
      return CompletionItemKind.Struct;
    case "EnumDefinition":
      return CompletionItemKind.Enum;
    case "EventDefinition":
      return CompletionItemKind.Event;
    case "ErrorDefinition":
      return CompletionItemKind.Event;
    case "StateVariableDefinition":
      return CompletionItemKind.Variable;
    case "ConstantDefinition":
      return CompletionItemKind.Constant;
    case "UserDefinedValueTypeDefinition":
      return CompletionItemKind.TypeParameter;
    case "FunctionDefinition":
    case "ConstructorDefinition":
    case "ModifierDefinition":
    case "FallbackFunctionDefinition":
    case "ReceiveFunctionDefinition":
    case "UnnamedFunctionDefinition":
      return CompletionItemKind.Function;
    default:
      return CompletionItemKind.Text;
  }
}

/**
 * Completion implementation.
 * Uses CST walking for scope enumeration and BindingGraph for member resolution.
 */
async function doComplete(
  serverState: ServerState,
  unit: CompilationUnit,
  internalUri: string,
  params: CompletionParams
): Promise<CompletionList | null> {
  const uri = params.textDocument.uri;

  // Get document text for context detection
  const document = serverState.documents.get(uri);

  if (document === undefined) {
    return null;
  }

  // Ensure AST module is loaded once for the sync helpers below.
  slangAst = await getSlangAst();

  const line = params.position.line;
  const character = params.position.character;

  // Text-based context detection
  const lineText = document.getText({
    start: { line, character: 0 },
    end: { line: line + 1, character: 0 },
  });

  const textBeforeCursor = document.getText({
    start: { line: 0, character: 0 },
    end: { line, character },
  });

  // 1. Check for natspec trigger
  const leadingText = document.getText({
    start: { line, character: Math.max(0, character - 3) },
    end: { line, character },
  });

  if (params.context?.triggerCharacter === "*" || leadingText === "///") {
    // Natspec completion: use CST to find next definition and build snippet
    return getNatspecCompletion(unit, internalUri, document, params);
  }

  // 2. Check for import context
  if (isInImportDirective(textBeforeCursor, lineText)) {
    return getImportCompletion(serverState, params, internalUri, lineText);
  }

  // 2b. If trigger is " but NOT in an import, return null (not relevant)
  if (params.context?.triggerCharacter === '"') {
    return null;
  }

  // 3. Check for '.' trigger — member access or global variable
  if (
    params.context?.triggerCharacter === "." ||
    isDotContext(textBeforeCursor)
  ) {
    return getDotCompletion(unit, internalUri, textBeforeCursor, params);
  }

  // 4. Default completions — scope-based definitions + keywords
  return getDefaultCompletions(unit, internalUri, params);
}

/**
 * Detect if the cursor is inside an import directive.
 */
function isInImportDirective(
  textBeforeCursor: string,
  lineText: string
): boolean {
  // Simple heuristic: line starts with "import" keyword
  const trimmedLine = lineText.trim();
  return (
    trimmedLine.startsWith("import ") ||
    trimmedLine.startsWith("import\t") ||
    trimmedLine.startsWith('import"') ||
    trimmedLine.startsWith("import'")
  );
}

/**
 * Handle import path completions using filesystem scanning.
 */
function getImportCompletion(
  serverState: ServerState,
  params: CompletionParams,
  fileUri: string,
  lineText: string
): CompletionList | null {
  const position = params.position;

  // Extract the import path typed so far from the text before cursor
  // Match: import "..." or import '...'
  const lineBeforeCursor = lineText.substring(0, position.character);
  const importMatch = lineBeforeCursor.match(/import\s+["']([^"']*)$/);

  if (importMatch === undefined || importMatch === null) {
    return null;
  }

  const currentImport = importMatch[1];

  // Non-relative imports: delegate to project's import completions
  if (currentImport !== "" && !currentImport.startsWith(".")) {
    return getNonRelativeImportCompletion(
      serverState,
      params,
      fileUri,
      currentImport,
      lineText
    );
  }

  // Reject patterns like "./sub/subsub/." (trailing dot within nested path)
  if (/[.^\w]\/\.$/.test(currentImport)) {
    return { isIncomplete: false, items: [] };
  }

  if (currentImport.endsWith(".sol")) {
    return { isIncomplete: false, items: [] };
  }

  const fileDir = path.dirname(fileUri);
  const importPath =
    currentImport === ""
      ? fileDir
      : toUnixStyle(path.join(fileDir, currentImport));

  let importDir: string;
  let partial: string;

  if (fs.existsSync(importPath) && fs.lstatSync(importPath).isDirectory()) {
    importDir = importPath;
    partial = "";
  } else {
    importDir = path.dirname(importPath);
    partial = importPath.replace(`${importDir}/`, "");

    if (!fs.existsSync(importDir)) {
      return { isIncomplete: false, items: [] };
    }
  }

  const files = fs
    .readdirSync(importDir)
    .filter((f) => f.startsWith(partial))
    .filter((f) => !fileUri.endsWith(f));

  // Resolve prefixes for display and insert text
  let prefix = "";
  let displayPrefix = "";

  switch (currentImport) {
    case "":
      prefix = "./";
      displayPrefix = "./";
      break;
    case ".":
      prefix = "/";
      displayPrefix = "./";
      break;
    case "./":
      prefix = "";
      displayPrefix = "./";
      break;
    case "..":
      prefix = "/";
      displayPrefix = "../";
      break;
    case "../":
      prefix = "";
      displayPrefix = "../";
      break;
    default:
      prefix = currentImport.endsWith("..") ? "/" : "";
      break;
  }

  const items: CompletionItem[] = [];

  for (const file of files) {
    try {
      const absolutePath = toUnixStyle(path.join(importDir, file));
      const fileStat = fs.lstatSync(absolutePath);
      const label = `${displayPrefix}${file}`;
      const insertText = `${prefix}${file}`;

      if (fileStat.isFile() && file.endsWith(".sol")) {
        if (partial === insertText) {
          continue; // Don't suggest current import
        }

        if (partial === "") {
          items.push({
            label,
            insertText,
            kind: CompletionItemKind.File,
            documentation: "Imports the package",
          });
        } else {
          // For partial matches, use textEdit to replace the partial text
          const startChar = position.character - partial.length;

          items.push({
            label: file,
            textEdit: {
              newText: file,
              range: {
                start: { line: position.line, character: startChar },
                end: { line: position.line, character: position.character },
              },
            },
            kind: CompletionItemKind.File,
            documentation: "Imports the package",
          });
        }
      } else if (fileStat.isDirectory() && file !== "node_modules") {
        if (partial === "") {
          items.push({
            label,
            insertText,
            kind: CompletionItemKind.Folder,
            documentation: "Imports the package",
          });
        } else {
          items.push({
            label: file,
            insertText: file,
            kind: CompletionItemKind.Folder,
            documentation: "Imports the package",
          });
        }
      }
    } catch {
      // Skip files that can't be stat'd
    }
  }

  // For empty imports, also include non-relative completions from the project
  if (currentImport === "") {
    const projectItems = getProjectImportItems(
      serverState,
      params,
      fileUri,
      currentImport
    );
    items.push(...projectItems);
  }

  // Add semicolon at end of line if the line is missing one
  const needsSemicolon = !lineText.trimEnd().endsWith(";");
  if (needsSemicolon) {
    for (const item of items) {
      item.additionalTextEdits = [
        {
          range: {
            start: { line: position.line, character: 999 },
            end: { line: position.line, character: 999 },
          },
          newText: ";",
        },
      ];
    }
  }

  return { isIncomplete: false, items };
}

/**
 * Handle non-relative import completions (node_modules, remappings).
 * Delegates to the project's getImportCompletions().
 */
function getNonRelativeImportCompletion(
  serverState: ServerState,
  params: CompletionParams,
  fileUri: string,
  currentImport: string,
  lineText: string
): CompletionList | null {
  const items = getProjectImportItems(
    serverState,
    params,
    fileUri,
    currentImport
  );

  // Add semicolon at end of line if the line is missing one
  const needsSemicolon = !lineText.trimEnd().endsWith(";");
  if (needsSemicolon) {
    for (const item of items) {
      item.additionalTextEdits = [
        {
          range: {
            start: { line: params.position.line, character: 999 },
            end: { line: params.position.line, character: 999 },
          },
          newText: ";",
        },
      ];
    }
  }

  return { isIncomplete: false, items };
}

/**
 * Get import completion items from the project (node_modules, remappings).
 */
function getProjectImportItems(
  serverState: ServerState,
  params: CompletionParams,
  fileUri: string,
  currentImport: string
): CompletionItem[] {
  const solFileEntry = serverState.solFileIndex[fileUri];

  if (solFileEntry === undefined) {
    return [];
  }

  return solFileEntry.project.getImportCompletions(
    params.position,
    currentImport
  );
}

/**
 * Detect if the cursor is in a dot-access context.
 */
function isDotContext(textBeforeCursor: string): boolean {
  // Look for a '.' immediately before the cursor (possibly with partial identifier)
  const match = textBeforeCursor.match(/\.\s*\w*$/);
  return match !== null;
}

/**
 * Extract the expression text before the last '.' in the text.
 */
function getExpressionBeforeDot(textBeforeCursor: string): string | undefined {
  // Match patterns like "msg.", "msg.sender.", "this.", "variable."
  const match = textBeforeCursor.match(/(\w[\w.]*)\.\s*\w*$/);
  return match?.[1];
}

/**
 * Handle dot-triggered completions (member access, global variables).
 */
async function getDotCompletion(
  unit: CompilationUnit,
  fileId: string,
  textBeforeCursor: string,
  params: CompletionParams
): Promise<CompletionList | null> {
  const expressionText = getExpressionBeforeDot(textBeforeCursor);

  if (expressionText === undefined) {
    return null;
  }

  // Check global variables first (msg, block, tx, abi, msg.sender)
  if (Object.keys(globalVariables).includes(expressionText)) {
    const items = getGlobalVariableCompletions(expressionText);
    return { isIncomplete: false, items };
  }

  // For this/super, enumerate contract members
  if (expressionText === "this" || expressionText === "super") {
    return getThisSuperCompletion(unit, fileId, expressionText, params);
  }

  // For other member access, try to resolve via BindingGraph
  return getMemberAccessCompletion(unit, fileId, textBeforeCursor, params);
}

/**
 * Get completions for global variables (msg, block, tx, abi, etc.)
 */
function getGlobalVariableCompletions(
  globalVariable: string
): CompletionItem[] {
  const members = globalVariables[globalVariable];

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (members) {
    return members.map((member: string) => ({
      label: member,
      kind: CompletionItemKind.Function,
    }));
  }

  return [];
}

/**
 * Handle `this.` and `super.` completions using AST wrappers.
 */
async function getThisSuperCompletion(
  unit: CompilationUnit,
  fileId: string,
  keyword: string,
  params: CompletionParams
): Promise<CompletionList | null> {
  const file = unit.file(fileId);

  if (file === undefined) {
    return null;
  }

  // Find the enclosing contract
  const cursor = file.createTreeCursor();
  const contractCursor = await findEnclosingContractAtPosition(
    cursor,
    params.position.line,
    params.position.character
  );

  if (contractCursor === undefined) {
    return null;
  }

  const items: CompletionItem[] = [];
  const seenNames = new Set<string>();

  if (keyword === "this") {
    // Enumerate the contract's own members + inherited
    collectContractMemberCompletions(
      contractCursor.node.asNonterminalNode()!,
      seenNames,
      items,
      false
    );
  }

  // Inherited members (for both this and super)
  const inheritedContracts = getInheritedContracts(unit, contractCursor);

  for (const parent of inheritedContracts) {
    collectContractMemberCompletions(parent.node, seenNames, items, true);
  }

  return { isIncomplete: false, items };
}

/**
 * Handle member access completions using BindingGraph resolution.
 */
async function getMemberAccessCompletion(
  unit: CompilationUnit,
  fileId: string,
  textBeforeCursor: string,
  _params: CompletionParams
): Promise<CompletionList | null> {
  const { TerminalKindExtensions } = await getSlangCst();

  // Extract the full expression chain, e.g. "stats.hero." → ["stats", "hero"]
  const match = textBeforeCursor.match(/(\w[\w.]*)\.\s*$/);

  if (match === null) {
    return null;
  }

  const parts = match[1].split(".");

  if (parts.length === 0) {
    return null;
  }

  // Locate the root identifier in the source text
  const rootIdent = parts[0];
  const exprEnd = textBeforeCursor.lastIndexOf(rootIdent);

  if (exprEnd < 0) {
    return null;
  }

  const lines = textBeforeCursor.substring(0, exprEnd).split("\n");
  const identLine = lines.length - 1;
  const identColumn = lines[lines.length - 1].length;

  const identCursor = getCursorAtPosition(unit, fileId, identLine, identColumn);

  if (identCursor === undefined) {
    return null;
  }

  if (
    !identCursor.node.isTerminalNode() ||
    !TerminalKindExtensions.isIdentifier(identCursor.node.kind)
  ) {
    return null;
  }

  // Resolve root identifier via BindingGraph
  let definition: Definition | undefined = resolveIdentifierDefinition(
    unit,
    identCursor
  );

  // Fallback: scan file for a definition with the same name
  if (definition === undefined) {
    definition = scanForDefinition(
      unit,
      fileId,
      rootIdent,
      TerminalKindExtensions
    );
  }

  if (definition === undefined) {
    return null;
  }

  // Walk the chain: resolve each intermediate member to its type definition
  for (let i = 1; i < parts.length; i++) {
    const memberName = parts[i];
    const typeDefCursor = resolveDefinitionToType(unit, definition);

    if (typeDefCursor === undefined) {
      return null;
    }

    // Find member with matching name in the type (struct, contract, etc.)
    definition = findMemberDefinition(unit, typeDefCursor, memberName);

    if (definition === undefined) {
      return null;
    }
  }

  // Return completions for the final definition's type
  return completionsForDefinition(unit, definition);
}

/**
 * Resolve an identifier cursor to its BindingGraph definition.
 */
function resolveIdentifierDefinition(
  unit: CompilationUnit,
  cursor: Cursor
): Definition | undefined {
  const reference = unit.bindingGraph.referenceAt(cursor);
  const directDef = unit.bindingGraph.definitionAt(cursor);

  if (directDef !== undefined) {
    return directDef;
  }

  if (reference !== undefined) {
    const definitions = reference.definitions();

    if (definitions.length > 0) {
      return definitions[0];
    }
  }

  return undefined;
}

/**
 * Scan the file for a definition with the given identifier name.
 * Used as fallback when BindingGraph can't resolve incomplete expressions.
 */
function scanForDefinition(
  unit: CompilationUnit,
  fileId: string,
  identName: string,
  TerminalKindExtensions: typeof TerminalKindExtensionsType
): Definition | undefined {
  const file = unit.file(fileId);

  if (file === undefined) {
    return undefined;
  }

  const scanCursor = file.createTreeCursor();

  while (scanCursor.goToNext()) {
    if (
      scanCursor.node.isTerminalNode() &&
      TerminalKindExtensions.isIdentifier(scanCursor.node.kind) &&
      scanCursor.node.unparse() === identName
    ) {
      const scanDef = unit.bindingGraph.definitionAt(scanCursor);

      if (scanDef !== undefined) {
        return scanDef;
      }
    }
  }

  return undefined;
}

/**
 * Given a definition, resolve its type to a cursor at the type's definition.
 */
function resolveDefinitionToType(
  unit: CompilationUnit,
  definition: Definition
): Cursor | undefined {
  const definiensLocation = definition.definiensLocation;

  if (!definiensLocation.isUserFileLocation()) {
    return undefined;
  }

  const defNode = definiensLocation.cursor.node.asNonterminalNode();

  if (defNode === undefined) {
    return undefined;
  }

  // If it's already a type definition, return its cursor directly
  if (
    defNode.kind === "StructDefinition" ||
    defNode.kind === "ContractDefinition" ||
    defNode.kind === "InterfaceDefinition" ||
    defNode.kind === "LibraryDefinition"
  ) {
    return definiensLocation.cursor;
  }

  // For variable definitions, resolve the type name
  if (
    defNode.kind === "StateVariableDefinition" ||
    defNode.kind === "VariableDeclarationStatement" ||
    defNode.kind === "Parameter" ||
    defNode.kind === "StructMember"
  ) {
    return resolveTypeFromCursor(unit, definiensLocation.cursor);
  }

  return undefined;
}

/**
 * Resolve the type of a variable/parameter/struct member from its cursor.
 * Walks children to find TypeName/IdentifierPath, then resolves via BindingGraph.
 */
function resolveTypeFromCursor(
  unit: CompilationUnit,
  defCursor: Cursor
): Cursor | undefined {
  const cursor = defCursor.clone();

  if (!cursor.goToFirstChild()) {
    return undefined;
  }

  do {
    const node = cursor.node.asNonterminalNode?.();

    if (
      node !== undefined &&
      (node.kind === "TypeName" || node.kind === "IdentifierPath")
    ) {
      return resolveTypeIdentifier(unit, cursor);
    }
  } while (cursor.goToNextSibling());

  return undefined;
}

/**
 * Resolve a TypeName/IdentifierPath cursor to the type's definition cursor.
 */
function resolveTypeIdentifier(
  unit: CompilationUnit,
  typeCursor: Cursor
): Cursor | undefined {
  const c = typeCursor.clone();

  if (!c.goToFirstChild()) {
    return undefined;
  }

  do {
    if (c.node.isTerminalNode() && c.node.kind === "Identifier") {
      const typeRef = unit.bindingGraph.referenceAt(c);

      if (typeRef !== undefined) {
        const typeDefs = typeRef.definitions();

        if (typeDefs.length > 0) {
          const typeDefLoc = typeDefs[0].definiensLocation;

          if (typeDefLoc.isUserFileLocation()) {
            return typeDefLoc.cursor;
          }
        }
      }

      return undefined;
    }

    // Descend into nested IdentifierPath
    const ntNode = c.node.asNonterminalNode?.();

    if (ntNode !== undefined && ntNode.kind === "IdentifierPath") {
      if (c.goToFirstChild()) {
        continue;
      }
    }
  } while (c.goToNextSibling());

  return undefined;
}

// Subtrees that contain identifiers which are NOT member names — parameter
// types, return types, function bodies, modifier invocations, override
// specifiers, and inheritance specifiers. Member lookup must NOT descend
// into these or a local variable can shadow a real state variable.
const MEMBER_LOOKUP_SKIP_KINDS = new Set([
  "FunctionBody",
  "Block",
  "ParametersDeclaration",
  "ReturnsDeclaration",
  "TypeName",
  "ModifierInvocation",
  "OverrideSpecifier",
  "InheritanceSpecifier",
  "ConstructorAttributes",
  "FunctionAttributes",
  "ModifierAttributes",
]);

/**
 * Find a named member definition within a type by walking the type's direct
 * members and resolving each member's name identifier through the binding
 * graph.
 *
 * The previous implementation walked every Identifier under the type, which
 * meant a local variable inside one of the type's methods could shadow a
 * state variable of the same name. Limiting to declaration-position
 * identifiers (skipping bodies, parameters, return types, and other
 * containers that hold non-member identifiers) prevents that.
 */
function findMemberDefinition(
  unit: CompilationUnit,
  typeCursor: Cursor,
  memberName: string
): Definition | undefined {
  const cursor = typeCursor.spawn();

  while (cursor.goToNext()) {
    if (
      cursor.node.isNonterminalNode() &&
      MEMBER_LOOKUP_SKIP_KINDS.has(cursor.node.kind)
    ) {
      cursor.goToNextNonDescendant();
      continue;
    }

    if (
      cursor.node.isTerminalNode() &&
      cursor.node.kind === "Identifier" &&
      cursor.node.unparse() === memberName
    ) {
      const def = unit.bindingGraph.definitionAt(cursor);

      if (def !== undefined) {
        return def;
      }
    }
  }

  return undefined;
}

/**
 * Return completions for a resolved definition.
 */
function completionsForDefinition(
  unit: CompilationUnit,
  definition: Definition
): CompletionList | null {
  const definiensLocation = definition.definiensLocation;

  if (!definiensLocation.isUserFileLocation()) {
    return null;
  }

  const defNode = definiensLocation.cursor.node.asNonterminalNode();

  if (defNode === undefined) {
    return null;
  }

  // For variables/parameters — resolve type and return its members
  if (
    defNode.kind === "StateVariableDefinition" ||
    defNode.kind === "VariableDeclarationStatement" ||
    defNode.kind === "Parameter" ||
    defNode.kind === "StructMember"
  ) {
    return resolveVariableTypeCompletion(unit, definiensLocation.cursor);
  }

  // For struct definitions — enumerate members using AST wrapper
  if (defNode.kind === "StructDefinition") {
    return collectStructMemberCompletions(defNode);
  }

  // For contracts/interfaces/libraries — enumerate their members
  const items: CompletionItem[] = [];
  const seenNames = new Set<string>();
  collectContractMemberCompletions(defNode, seenNames, items, false);

  if (items.length === 0) {
    return null;
  }

  return { isIncomplete: false, items };
}

/**
 * Resolve a variable's type and return completions for its members.
 * Handles struct fields and array built-ins.
 */
function resolveVariableTypeCompletion(
  unit: CompilationUnit,
  defCursor: Cursor
): CompletionList | null {
  const defText = defCursor.node.unparse() as string;

  // Check for array types — includes dynamic (uint[]) and fixed-size (uint[1])
  if (/\[\s*\d*\s*\]/.test(defText)) {
    return { isIncomplete: false, items: arrayCompletions };
  }

  // Resolve the type identifier and return its members
  const typeCursor = resolveTypeFromCursor(unit, defCursor);

  if (typeCursor === undefined) {
    return null;
  }

  const typeDefNode = typeCursor.node.asNonterminalNode?.();

  if (typeDefNode === undefined) {
    return null;
  }

  if (typeDefNode.kind === "StructDefinition") {
    return collectStructMemberCompletions(typeDefNode);
  }

  if (
    typeDefNode.kind === "ContractDefinition" ||
    typeDefNode.kind === "InterfaceDefinition" ||
    typeDefNode.kind === "LibraryDefinition"
  ) {
    const items: CompletionItem[] = [];
    const seenNames = new Set<string>();
    collectContractMemberCompletions(typeDefNode, seenNames, items, false);

    if (items.length > 0) {
      return { isIncomplete: false, items };
    }
  }

  return null;
}

/**
 * Collect struct member names as completion items using AST wrapper.
 */
function collectStructMemberCompletions(
  structNode: NonterminalNode
): CompletionList | null {
  const { StructDefinition } = slangAst!;
  const struct = new StructDefinition(structNode);
  const items = struct.members.items.map(
    (m: { name: { unparse: () => string } }) => ({
      label: m.name.unparse(),
      kind: CompletionItemKind.Field,
    })
  );
  return items.length > 0 ? { isIncomplete: false, items } : null;
}

/**
 * Collect member definitions from a contract/interface/library using AST wrappers.
 */
function collectContractMemberCompletions(
  contractNode: NonterminalNode,
  seenNames: Set<string>,
  items: CompletionItem[],
  skipPrivate: boolean
): void {
  const { ContractDefinition, InterfaceDefinition, LibraryDefinition } =
    slangAst!;

  // Members are typed as readonly arrays of distinct member-variant unions
  // per container kind (Contract / Interface / Library); we only need each
  // member's `.variant` and `.cst`, so the readonly union is enough.
  interface MemberLike {
    variant: { cst: NonterminalNode; unparse?: () => string };
    cst: NonterminalNode;
  }
  let memberItems: readonly MemberLike[];

  if (contractNode.kind === "ContractDefinition") {
    memberItems = new ContractDefinition(contractNode).members
      .items as readonly MemberLike[];
  } else if (contractNode.kind === "InterfaceDefinition") {
    memberItems = new InterfaceDefinition(contractNode).members
      .items as readonly MemberLike[];
  } else if (contractNode.kind === "LibraryDefinition") {
    memberItems = new LibraryDefinition(contractNode).members
      .items as readonly MemberLike[];
  } else {
    return;
  }

  for (const member of memberItems) {
    const variant = member.variant;
    const variantKind = variant.cst.kind;

    if (!DEFINITION_KINDS.has(variantKind)) {
      continue;
    }

    const name = getDefinitionName(variant);

    if (name === undefined || seenNames.has(name)) {
      continue;
    }

    if (skipPrivate) {
      const text = variant.cst.unparse();
      if (text.includes("private")) {
        continue;
      }
    }

    seenNames.add(name);
    items.push({
      label: name,
      kind: completionKindForNonterminal(variantKind),
      documentation: {
        kind: MarkupKind.Markdown,
        value: buildDocumentation(variantKind, name),
      },
    });
  }
}

/**
 * Get the name of a definition node using AST wrappers. `node` is one of
 * the member-variant AST objects (FunctionDefinition, EventDefinition, …);
 * its `cst` field is the corresponding NonterminalNode.
 */
function getDefinitionName(node: { cst: NonterminalNode }): string | undefined {
  const {
    FunctionDefinition,
    ModifierDefinition,
    StructDefinition,
    EnumDefinition,
    EventDefinition,
    ErrorDefinition,
    StateVariableDefinition,
    UserDefinedValueTypeDefinition,
  } = slangAst!;

  const kind = node.cst.kind;

  switch (kind) {
    case "FunctionDefinition":
      return new FunctionDefinition(node.cst).name.variant.unparse();
    case "ConstructorDefinition":
      return "constructor";
    case "ModifierDefinition":
      return new ModifierDefinition(node.cst).name.unparse();
    case "StructDefinition":
      return new StructDefinition(node.cst).name.unparse();
    case "EnumDefinition":
      return new EnumDefinition(node.cst).name.unparse();
    case "EventDefinition":
      return new EventDefinition(node.cst).name.unparse();
    case "ErrorDefinition":
      return new ErrorDefinition(node.cst).name.unparse();
    case "StateVariableDefinition":
      return new StateVariableDefinition(node.cst).name.unparse();
    case "UserDefinedValueTypeDefinition":
      return new UserDefinedValueTypeDefinition(node.cst).name.unparse();
    case "ReceiveFunctionDefinition":
      return "receive";
    case "FallbackFunctionDefinition":
      return "fallback";
    case "UnnamedFunctionDefinition":
      return "function";
    default:
      return undefined;
  }
}

/**
 * Default completions: walk up the CST from cursor position,
 * collecting definitions at each scope level + keyword defaults.
 */
function getDefaultCompletions(
  unit: CompilationUnit,
  fileId: string,
  params: CompletionParams
): CompletionList | null {
  const file = unit.file(fileId);

  if (file === undefined) {
    return null;
  }

  const cursor = file.createTreeCursor();
  const items: CompletionItem[] = [];
  const seenNames = new Set<string>();

  // Collect definitions from all enclosing scopes
  collectScopeDefinitions(
    cursor,
    params.position.line,
    params.position.character,
    seenNames,
    items
  );

  // Add keyword completions
  items.push(...defaultCompletion);

  return { isIncomplete: false, items };
}

/**
 * Walk the CST from root to the cursor position, collecting definitions
 * at each scope level along the path.
 */
function collectScopeDefinitions(
  cursor: Cursor,
  line: number,
  column: number,
  seenNames: Set<string>,
  items: CompletionItem[]
): void {
  const node = cursor.node.asNonterminalNode();

  if (node === undefined) {
    return;
  }

  // If this is a scope container, collect definitions from it
  if (SCOPE_KINDS.has(node.kind)) {
    collectDefinitionsFromScope(cursor.clone(), seenNames, items);
  }

  // Descend into the child that contains the cursor position
  if (!cursor.goToFirstChild()) {
    return;
  }

  do {
    const childRange = cursor.textRange;
    const inRange =
      (line > childRange.start.line ||
        (line === childRange.start.line &&
          column >= childRange.start.column)) &&
      (line < childRange.end.line ||
        (line === childRange.end.line && column <= childRange.end.column));

    if (inRange) {
      collectScopeDefinitions(cursor, line, column, seenNames, items);
      break;
    }
  } while (cursor.goToNextSibling());
}

/**
 * Collect definition names from a scope node's direct children.
 * Uses AST wrappers for VariableDeclarationStatement and ParametersDeclaration.
 */
function collectDefinitionsFromScope(
  cursor: Cursor,
  seenNames: Set<string>,
  items: CompletionItem[]
): void {
  if (!cursor.goToFirstChild()) {
    return;
  }

  do {
    const node = cursor.node.asNonterminalNode();

    if (node === undefined) {
      continue;
    }

    // Check direct children that are definitions
    if (DEFINITION_KINDS.has(node.kind)) {
      const name = getDefinitionNameFromCst(node);

      if (name !== undefined && !seenNames.has(name)) {
        seenNames.add(name);
        items.push({
          label: name,
          kind: completionKindForNonterminal(node.kind),
          documentation: {
            kind: MarkupKind.Markdown,
            value: buildDocumentation(node.kind, name),
          },
        });
      }
    }

    // SourceUnitMembers, ContractMembers, etc. wrap definitions
    if (
      node.kind === "SourceUnitMembers" ||
      node.kind === "ContractMembers" ||
      node.kind === "SourceUnitMember" ||
      node.kind === "ContractMember"
    ) {
      collectDefinitionsFromScope(cursor.clone(), seenNames, items);
    }

    // Block/Statement containers — collect variable declarations
    if (
      node.kind === "Statements" ||
      node.kind === "Statement" ||
      node.kind === "Block"
    ) {
      collectDefinitionsFromScope(cursor.clone(), seenNames, items);
    }

    // Variable declaration statements — use AST wrapper
    if (node.kind === "VariableDeclarationStatement") {
      const { VariableDeclarationStatement } = slangAst!;
      const varDecl = new VariableDeclarationStatement(node);
      const varName = varDecl.name.unparse();
      if (varName !== undefined && !seenNames.has(varName)) {
        seenNames.add(varName);
        items.push({
          label: varName,
          kind: CompletionItemKind.Variable,
        });
      }
    }

    // Function parameters — use AST wrapper
    if (node.kind === "ParametersDeclaration") {
      const { ParametersDeclaration } = slangAst!;
      const paramsDecl = new ParametersDeclaration(node);
      for (const param of paramsDecl.parameters.items) {
        const paramName = param.name?.unparse();
        if (paramName !== undefined && !seenNames.has(paramName)) {
          seenNames.add(paramName);
          items.push({
            label: paramName,
            kind: CompletionItemKind.Variable,
          });
        }
      }
    }

    if (node.kind === "Parameters") {
      const { Parameters } = slangAst!;
      const params = new Parameters(node);
      for (const param of params.items) {
        const paramName = param.name?.unparse();
        if (paramName !== undefined && !seenNames.has(paramName)) {
          seenNames.add(paramName);
          items.push({
            label: paramName,
            kind: CompletionItemKind.Variable,
          });
        }
      }
    }
  } while (cursor.goToNextSibling());
}

/**
 * Get the name of a definition from a CST NonterminalNode.
 */
function getDefinitionNameFromCst(node: NonterminalNode): string | undefined {
  const {
    FunctionDefinition,
    ModifierDefinition,
    StructDefinition,
    EnumDefinition,
    EventDefinition,
    ErrorDefinition,
    StateVariableDefinition,
    UserDefinedValueTypeDefinition,
    ConstantDefinition,
  } = slangAst!;

  switch (node.kind) {
    case "FunctionDefinition":
      return new FunctionDefinition(node).name.variant.unparse();
    case "ConstructorDefinition":
      return "constructor";
    case "ModifierDefinition":
      return new ModifierDefinition(node).name.unparse();
    case "StructDefinition":
      return new StructDefinition(node).name.unparse();
    case "EnumDefinition":
      return new EnumDefinition(node).name.unparse();
    case "EventDefinition":
      return new EventDefinition(node).name.unparse();
    case "ErrorDefinition":
      return new ErrorDefinition(node).name.unparse();
    case "StateVariableDefinition":
      return new StateVariableDefinition(node).name.unparse();
    case "ConstantDefinition":
      return new ConstantDefinition(node).name.unparse();
    case "UserDefinedValueTypeDefinition":
      return new UserDefinedValueTypeDefinition(node).name.unparse();
    case "ReceiveFunctionDefinition":
      return "receive";
    case "FallbackFunctionDefinition":
      return "fallback";
    case "UnnamedFunctionDefinition":
      return "function";
    case "ContractDefinition": {
      const { ContractDefinition } = slangAst!;
      return new ContractDefinition(node).name.unparse();
    }
    case "InterfaceDefinition": {
      const { InterfaceDefinition } = slangAst!;
      return new InterfaceDefinition(node).name.unparse();
    }
    case "LibraryDefinition": {
      const { LibraryDefinition } = slangAst!;
      return new LibraryDefinition(node).name.unparse();
    }
    default:
      return undefined;
  }
}

/**
 * Build a documentation string for a completion item.
 */
function buildDocumentation(kind: string, name: string): string {
  switch (kind) {
    case "ContractDefinition":
      return `contract ${name}`;
    case "InterfaceDefinition":
      return `interface ${name}`;
    case "LibraryDefinition":
      return `library ${name}`;
    case "StructDefinition":
      return `struct ${name}`;
    case "EnumDefinition":
      return `enum ${name}`;
    case "EventDefinition":
      return `event ${name}`;
    case "ErrorDefinition":
      return `error ${name}`;
    case "ModifierDefinition":
      return `modifier ${name}`;
    default:
      return name;
  }
}

/**
 * Natspec completion.
 * Finds the next definition after the cursor and builds the natspec template.
 * Uses AST wrappers for parameter extraction.
 */
function getNatspecCompletion(
  unit: CompilationUnit,
  fileId: string,
  document: {
    getText: (range: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    }) => string;
  },
  params: CompletionParams
): CompletionList | null {
  const file = unit.file(fileId);

  if (file === undefined) {
    return null;
  }

  const line = params.position.line;
  const lineText = document.getText({
    start: { line, character: 0 },
    end: { line: line + 1, character: 0 },
  });

  const isMultiLine = lineText.includes("/** */");
  const isSingleLine = lineText.includes("///");

  if (!isMultiLine && !isSingleLine) {
    return null;
  }

  // Find the next definition after the cursor position
  const cursor = file.createTreeCursor();
  const defInfo = findNextDefinition(cursor, line);

  if (defInfo === undefined) {
    return null;
  }

  const range = {
    start: params.position,
    end: params.position,
  };

  let text = "";
  let tabIndex = 1;

  if (
    defInfo.kind === "ContractDefinition" ||
    defInfo.kind === "InterfaceDefinition" ||
    defInfo.kind === "LibraryDefinition"
  ) {
    if (isMultiLine) {
      text += "\n * @title $1\n";
      text += " * @author $2\n";
      text += " * @notice $3\n";
    } else {
      text += " @title $1\n";
      text += "/// @author $2\n";
      text += "/// @notice $3";
    }

    return {
      isIncomplete: false,
      items: [
        {
          label: "NatSpec contract documentation",
          textEdit: { range, newText: text },
          insertTextFormat: 2, // Snippet
        },
      ],
    };
  }

  if (defInfo.kind === "EventDefinition") {
    if (isMultiLine) {
      text += "\n * $0\n";
      for (const param of defInfo.params) {
        text += ` * @param ${param} \${${tabIndex++}}\n`;
      }
    } else {
      text += " $0";
      for (const param of defInfo.params) {
        text += `\n/// @param ${param} \${${tabIndex++}}`;
      }
    }

    return {
      isIncomplete: false,
      items: [
        {
          label: "NatSpec event documentation",
          textEdit: { range, newText: text },
          insertTextFormat: 2,
        },
      ],
    };
  }

  if (defInfo.kind === "StateVariableDefinition") {
    const isPublic = defInfo.text.includes("public");
    if (isMultiLine) {
      text = isPublic ? "\n * @notice ${0}\n" : "\n * @dev ${0}\n";
    } else {
      text = isPublic ? " @notice ${0}" : " @dev ${0}";
    }

    return {
      isIncomplete: false,
      items: [
        {
          label: "NatSpec variable documentation",
          textEdit: { range, newText: text },
          insertTextFormat: 2,
        },
      ],
    };
  }

  if (
    defInfo.kind === "FunctionDefinition" ||
    defInfo.kind === "ConstructorDefinition" ||
    defInfo.kind === "ModifierDefinition"
  ) {
    const prefix = isMultiLine ? " *" : "///";
    const linesToAdd = [];

    linesToAdd.push("$0");

    for (const param of defInfo.params) {
      linesToAdd.push(`@param ${param} \${${tabIndex++}}`);
    }

    // Check for return parameters
    if (defInfo.returnParams.length >= 2) {
      for (const ret of defInfo.returnParams) {
        if (ret.length > 0) {
          linesToAdd.push(`@return ${ret} \${${tabIndex++}}`);
        } else {
          linesToAdd.push(`@return \${${tabIndex++}}`);
        }
      }
    }

    text = isMultiLine ? "\n" : "";
    text += linesToAdd
      .map((l, i) => (i !== 0 || isMultiLine ? `${prefix} ${l}` : ` ${l}`))
      .join("\n");

    if (isMultiLine) {
      text += "\n";
    }

    return {
      isIncomplete: false,
      items: [
        {
          label: "NatSpec function documentation",
          textEdit: { range, newText: text },
          insertTextFormat: 2,
        },
      ],
    };
  }

  return null;
}

interface DefinitionInfo {
  kind: string;
  params: string[];
  returnParams: string[];
  text: string;
}

/**
 * Find the next definition after the given line in the CST.
 * Uses AST wrappers for parameter extraction.
 */
function findNextDefinition(
  cursor: Cursor,
  afterLine: number
): DefinitionInfo | undefined {
  const definitionKinds = new Set([
    "FunctionDefinition",
    "ConstructorDefinition",
    "ContractDefinition",
    "InterfaceDefinition",
    "LibraryDefinition",
    "EventDefinition",
    "StateVariableDefinition",
    "ModifierDefinition",
    "ErrorDefinition",
  ]);

  let closest: { kind: string; startLine: number; cursor: Cursor } | undefined;

  // Walk the entire tree in pre-order to find the closest definition after afterLine
  const walk = (c: Cursor): void => {
    do {
      const node = c.node.asNonterminalNode();

      if (node !== undefined) {
        const startLine = c.textRange.start.line;

        if (definitionKinds.has(node.kind)) {
          // textRange.start.line includes leading trivia (comments, blank lines).
          // Find the first significant keyword to get the real definition line.
          const keywordLine = findFirstKeywordLine(c.clone());
          const effectiveLine = keywordLine ?? startLine;

          if (effectiveLine > afterLine) {
            if (closest === undefined || effectiveLine < closest.startLine) {
              closest = {
                kind: node.kind,
                startLine: effectiveLine,
                cursor: c.clone(),
              };
            }
            // Don't descend into this definition (we found it)
            continue;
          }
        }

        // Descend into non-definition nodes to find nested definitions
        if (c.goToFirstChild()) {
          walk(c);
          c.goToParent();
        }
      }
    } while (c.goToNextSibling());
  };

  if (cursor.goToFirstChild()) {
    walk(cursor);
  }

  if (closest === undefined) {
    return undefined;
  }

  const defText = closest.cursor.node.unparse();
  const defNode = closest.cursor.node.asNonterminalNode()!;
  const params = extractParameterNamesFromDef(defNode);
  const returnParams = extractReturnParameterNamesFromDef(defNode);

  return {
    kind: closest.kind,
    params,
    returnParams,
    text: defText,
  };
}

/**
 * Find the line of the first significant (non-trivia) terminal in a nonterminal.
 */
function findFirstKeywordLine(cursor: Cursor): number | undefined {
  if (!cursor.goToFirstChild()) {
    return undefined;
  }

  do {
    if (cursor.node.isTerminalNode()) {
      const kind = cursor.node.kind;

      // Skip trivia terminals
      if (
        kind !== "Whitespace" &&
        kind !== "EndOfLine" &&
        kind !== "SingleLineComment" &&
        kind !== "SingleLineNatSpecComment" &&
        kind !== "MultiLineComment" &&
        kind !== "MultiLineNatSpecComment"
      ) {
        return cursor.textRange.start.line;
      }
    } else {
      // Recurse into nonterminal children
      const line = findFirstKeywordLine(cursor.clone());

      if (line !== undefined) {
        return line;
      }
    }
  } while (cursor.goToNextSibling());

  return undefined;
}

// Common shape of the Parameter/EventParameter/etc. AST items we read here:
// they all expose an optional `name` terminal with an `unparse()` method.
interface NamedParamItem {
  name?: { unparse: () => string };
}

const unparseOptionalName = (p: NamedParamItem): string | undefined =>
  p.name?.unparse();
const isString = (n: string | undefined): n is string => n !== undefined;

/**
 * Extract parameter names from a definition node using AST wrappers.
 *
 * Unnamed parameters (positional-only) are filtered out — callers use this
 * to populate natspec `@param` lines, and `@param ` with no identifier is
 * invalid. Compare with `extractReturnParameterNamesFromDef` which keeps
 * empty strings: a function's `returns` clause may legitimately list types
 * without names (`returns (uint, uint)`), and natspec `@return` lines still
 * need one entry per return value, name or no name.
 */
function extractParameterNamesFromDef(defNode: NonterminalNode): string[] {
  const {
    FunctionDefinition,
    ConstructorDefinition,
    ModifierDefinition,
    EventDefinition,
  } = slangAst!;

  switch (defNode.kind) {
    case "FunctionDefinition": {
      const func = new FunctionDefinition(defNode);
      return func.parameters.parameters.items
        .map(unparseOptionalName)
        .filter(isString);
    }
    case "ConstructorDefinition": {
      const ctor = new ConstructorDefinition(defNode);
      return ctor.parameters.parameters.items
        .map(unparseOptionalName)
        .filter(isString);
    }
    case "ModifierDefinition": {
      const mod = new ModifierDefinition(defNode);
      const paramsDecl = mod.parameters;
      if (paramsDecl === undefined) {
        return [];
      }
      return paramsDecl.parameters.items
        .map(unparseOptionalName)
        .filter(isString);
    }
    case "EventDefinition": {
      const event = new EventDefinition(defNode);
      return event.parameters.parameters.items
        .map(unparseOptionalName)
        .filter(isString);
    }
    default:
      return [];
  }
}

/**
 * Extract return parameter names from a function definition using AST wrappers.
 */
function extractReturnParameterNamesFromDef(
  defNode: NonterminalNode
): string[] {
  const { FunctionDefinition } = slangAst!;

  if (defNode.kind !== "FunctionDefinition") {
    return [];
  }

  const func = new FunctionDefinition(defNode);
  const returnsDecl = func.returns;

  if (returnsDecl === undefined) {
    return [];
  }

  return returnsDecl.variables.parameters.items.map(
    (p: NamedParamItem) => p.name?.unparse() ?? ""
  );
}

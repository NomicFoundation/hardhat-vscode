import { Range, Position, Location } from "vscode-languageserver-types";
import semver from "semver";
import { analyze } from "@nomicfoundation/solidity-analyzer";
import type {
  Cursor,
  Node,
  NonterminalNode,
  Query,
  TextIndex,
  TextRange,
} from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import type {
  Definition,
  Reference,
  UserFileLocation,
} from "@nomicfoundation/slang/bindings" with { "resolution-mode": "import" };
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with {
  "resolution-mode": "import",
};
// These four go through `import type * as` rather than `typeof import(...)`,
// which reads more directly but cannot be formatted: over the print width
// prettier splits the attributes clause and adds a trailing comma, and
// TypeScript rejects a trailing comma there (TS1005). They are type-only, so
// nothing survives to runtime — the modules are still loaded lazily below.
import type * as slangCst from "@nomicfoundation/slang/cst" with {
  "resolution-mode": "import",
};
import type * as slangAst from "@nomicfoundation/slang/ast" with {
  "resolution-mode": "import",
};
import type * as slangParser from "@nomicfoundation/slang/parser" with {
  "resolution-mode": "import",
};
import type * as slangUtils from "@nomicfoundation/slang/utils" with {
  "resolution-mode": "import",
};
import { Logger } from "../utils/Logger";
import { decodeUriAndRemoveFilePrefix, toUri } from "../utils";
import { ServerState } from "../types";
import { getOrInitialiseSolFileEntry } from "../utils/getOrInitialiseSolFileEntry";

// ---------------------------------------------------------------------------
// Cached dynamic-import loaders for the ESM-only Slang submodules. Repeated
// `await import("@nomicfoundation/slang/X")` calls hit Node's ESM module
// cache after the first one, so this is a style/discoverability fix rather
// than a perf one — but it gives consumers one typed entry point per
// submodule and a single place to evolve the loading strategy later.
// ---------------------------------------------------------------------------

type SlangCstModule = typeof slangCst;
type SlangAstModule = typeof slangAst;
type SlangParserModule = typeof slangParser;
type SlangUtilsModule = typeof slangUtils;

let _slangCst: SlangCstModule | undefined;
let _slangAst: SlangAstModule | undefined;
let _slangParser: SlangParserModule | undefined;
let _slangUtils: SlangUtilsModule | undefined;

export async function getSlangCst(): Promise<SlangCstModule> {
  if (_slangCst === undefined) {
    _slangCst = await import("@nomicfoundation/slang/cst");
  }
  return _slangCst;
}

export async function getSlangAst(): Promise<SlangAstModule> {
  if (_slangAst === undefined) {
    _slangAst = await import("@nomicfoundation/slang/ast");
  }
  return _slangAst;
}

export async function getSlangParser(): Promise<SlangParserModule> {
  if (_slangParser === undefined) {
    _slangParser = await import("@nomicfoundation/slang/parser");
  }
  return _slangParser;
}

export async function getSlangUtils(): Promise<SlangUtilsModule> {
  if (_slangUtils === undefined) {
    _slangUtils = await import("@nomicfoundation/slang/utils");
  }
  return _slangUtils;
}

export function toVSCodeRange(range: TextRange): Range {
  return {
    start: toVSCodePosition(range.start),
    end: toVSCodePosition(range.end),
  };
}

export function toVSCodePosition(position: TextIndex): Position {
  return {
    line: position.line,
    character: position.column,
  };
}

export async function resolveVersion(
  logger: Logger,
  versionPragmas: string[]
): Promise<string> {
  const { LanguageFacts } = await getSlangUtils();
  const versions = LanguageFacts.allVersions();

  const resolvedVersion = semver.maxSatisfying(
    versions,
    versionPragmas.join(" ")
  );

  if (resolvedVersion !== null) {
    return resolvedVersion;
  } else {
    const latest = versions[versions.length - 1];

    logger.info(
      `[warn] No supported version (latest: ${latest}) for Solidity found that satisfies the pragma directives: '${versionPragmas.join(
        " "
      )}'.`
    );

    return latest;
  }
}

/**
 * Navigate a CST cursor to the terminal node at a given line/column position.
 * Returns a clone of the cursor pointing at the terminal, or undefined
 * if the position is outside the tree.
 *
 * Ported from parser documentation examples.
 */
export function findTerminalNodeAt(
  cursor: Cursor,
  line: number,
  column: number
): Cursor | undefined {
  const range = cursor.textRange;

  if (
    line < range.start.line ||
    (line === range.start.line && column < range.start.column) ||
    line > range.end.line ||
    (line === range.end.line && column >= range.end.column)
  ) {
    return undefined;
  }

  // eslint-disable-next-line no-constant-condition
  outer: while (cursor.node.isNonterminalNode()) {
    if (!cursor.goToFirstChild()) {
      break;
    }

    do {
      const childRange = cursor.textRange;

      if (
        line < childRange.end.line ||
        (line === childRange.end.line && column < childRange.end.column)
      ) {
        continue outer;
      }
    } while (cursor.goToNextSibling());

    // No matching child found
    return undefined;
  }

  if (cursor.node.isTerminalNode()) {
    return cursor;
  }

  return undefined;
}

/**
 * Return a tree cursor for `uri`'s content. Reuses the project compilation's
 * parsed tree if cached; otherwise does a one-off standalone parse for the
 * file's text. Used by handlers like documentSymbol/semanticTokens that
 * only need a CST and don't care about cross-file binding.
 */
export async function getOrParseFileCursor(
  serverState: ServerState,
  uri: string,
  text: string
): Promise<Cursor | undefined> {
  // Dynamic import to break the slangHelpers ↔ compilation cycle.
  const { getCompilationForFile } = await import("./compilation.js");
  const internalUri = decodeUriAndRemoveFilePrefix(uri);

  const unit = await getCompilationForFile(serverState, uri);
  const file = unit?.file(internalUri);

  if (file !== undefined) {
    return file.createTreeCursor();
  }

  const { versionPragmas } = analyze(text);
  const version = await resolveVersion(serverState.logger, versionPragmas);
  const { Parser } = await getSlangParser();
  return Parser.create(version).parseFileContents(text).createTreeCursor();
}

/**
 * Get a cursor positioned at a given line/column within a CompilationUnit file.
 */
export function getCursorAtPosition(
  unit: CompilationUnit,
  fileId: string,
  line: number,
  column: number
): Cursor | undefined {
  const file = unit.file(fileId);

  if (file === undefined) {
    return undefined;
  }

  const cursor = file.createTreeCursor();
  return findTerminalNodeAt(cursor, line, column);
}

/**
 * Convert a UserFileLocation to a VS Code LSP Location.
 */
export function userFileLocationToLSPLocation(
  location: UserFileLocation
): Location {
  const cursor = location.cursor;
  const range = cursor.textRange;

  return {
    uri: toUri(location.fileId),
    range: toVSCodeRange(range),
  };
}

// ---------------------------------------------------------------------------
// Identifier resolution via BindingGraph
// ---------------------------------------------------------------------------

/**
 * Result of resolving an identifier terminal via BindingGraph.
 */
export interface IdentifierResolution {
  cursor: Cursor;
  reference: Reference | undefined;
  definition: Definition | undefined;
}

/**
 * Check if a cursor points to an identifier terminal, and if so resolve it
 * via BindingGraph. Use this when you already have a positioned cursor.
 */
export async function resolveIdentifierFromCursor(
  unit: CompilationUnit,
  cursor: Cursor
): Promise<IdentifierResolution | undefined> {
  const { TerminalKindExtensions } = await getSlangCst();

  if (
    !cursor.node.isTerminalNode() ||
    !TerminalKindExtensions.isIdentifier(cursor.node.kind)
  ) {
    return undefined;
  }

  return {
    cursor,
    reference: unit.bindingGraph.referenceAt(cursor),
    definition: unit.bindingGraph.definitionAt(cursor),
  };
}

/**
 * Resolve the identifier at a given line/column position in a file.
 * Combines getCursorAtPosition + terminal/identifier checks + BindingGraph resolution.
 */
export async function resolveIdentifierAtPosition(
  unit: CompilationUnit,
  fileId: string,
  line: number,
  column: number
): Promise<IdentifierResolution | undefined> {
  const cursor = getCursorAtPosition(unit, fileId, line, column);

  if (cursor === undefined) {
    return undefined;
  }

  return resolveIdentifierFromCursor(unit, cursor);
}

/**
 * Resolve an IdentifierResolution to a single Definition.
 * Tries the direct definition first, then the first definition from the reference.
 */
export function resolveToDefinition(
  resolution: IdentifierResolution
): Definition | undefined {
  if (resolution.definition !== undefined) {
    return resolution.definition;
  }

  if (resolution.reference !== undefined) {
    const defs = resolution.reference.definitions();

    if (defs.length > 0) {
      return defs[0];
    }
  }

  return undefined;
}

/**
 * Collect all unique definitions from an IdentifierResolution.
 * Includes definitions from the reference and the direct definition, deduplicated by id.
 */
export function collectAllDefinitions(
  resolution: IdentifierResolution
): Definition[] {
  const defs: Definition[] = [];
  const seenIds = new Set<number>();

  if (resolution.reference !== undefined) {
    for (const def of resolution.reference.definitions()) {
      if (!seenIds.has(def.id)) {
        seenIds.add(def.id);
        defs.push(def);
      }
    }
  }

  if (
    resolution.definition !== undefined &&
    !seenIds.has(resolution.definition.id)
  ) {
    defs.push(resolution.definition);
  }

  return defs;
}

// ---------------------------------------------------------------------------
// Import path navigation
// ---------------------------------------------------------------------------

/**
 * Resolve import path navigation: when cursor is on a string literal
 * inside an ImportDirective, resolve the import path and return a
 * Location for the target file.
 */
export async function resolveImportPathNavigation(
  serverState: ServerState,
  unit: CompilationUnit,
  cursor: Cursor,
  sourceFileId: string
): Promise<Location | undefined> {
  const { NonterminalKind } = await getSlangCst();

  // Walk ancestors to confirm we're inside an ImportDirective
  let isInImport = false;

  for (const ancestor of cursor.ancestors()) {
    if (
      ancestor.isNonterminalNode() &&
      ancestor.kind === NonterminalKind.ImportDirective
    ) {
      isInImport = true;
      break;
    }
  }

  if (!isInImport) {
    return undefined;
  }

  // Extract the import path from the string literal
  // Strip the surrounding quote characters from the literal — both ends are
  // guaranteed by the grammar to be matching quotes. Same convention as
  // `compilation.ts`.
  const pathLiteral = cursor.node.unparse();
  const importPath = pathLiteral.slice(1, -1);

  if (importPath.length === 0) {
    return undefined;
  }

  // Resolve the import path through the project
  const solFileEntry = getOrInitialiseSolFileEntry(serverState, sourceFileId);
  const project = solFileEntry.project;

  try {
    const resolved = await project.resolveImportPath(sourceFileId, importPath);

    if (resolved === undefined) {
      return undefined;
    }

    // Get the target file's content to compute the full-file range
    const targetFile = unit.file(resolved);

    if (targetFile !== undefined) {
      const targetCursor = targetFile.createTreeCursor();
      const range = targetCursor.textRange;

      return {
        uri: toUri(resolved),
        range: {
          start: { line: range.start.line, character: range.start.column },
          end: { line: range.end.line, character: range.end.column },
        },
      };
    }

    // File not in compilation unit — return the first line
    return {
      uri: toUri(resolved),
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
    };
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// CST traversal primitives
// ---------------------------------------------------------------------------

/**
 * Pre-order walk descendants of `cursor` and return the first cursor for
 * which `predicate` is true. Caller owns the returned clone.
 */
export function findFirstDescendant(
  cursor: Cursor,
  predicate: (c: Cursor) => boolean
): Cursor | undefined {
  const c = cursor.spawn();

  while (c.goToNext()) {
    if (predicate(c)) {
      return c.clone();
    }
  }

  return undefined;
}

/**
 * Pre-order walk descendants of `cursor` and return every cursor for which
 * `predicate` is true. Caller owns the returned clones.
 */
export function findAllDescendants(
  cursor: Cursor,
  predicate: (c: Cursor) => boolean
): Cursor[] {
  const results: Cursor[] = [];
  const c = cursor.spawn();

  while (c.goToNext()) {
    if (predicate(c)) {
      results.push(c.clone());
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Cached queries (created lazily on first use)
// ---------------------------------------------------------------------------

type ContractQueryKey = "contractDef" | "interfaceDef" | "libraryDef";

let _queries:
  | {
      constructor: Query;
      contractDef: Query;
      interfaceDef: Query;
      libraryDef: Query;
    }
  | undefined;

async function ensureQueries() {
  if (_queries !== undefined) {
    return _queries;
  }

  const { Query } = await getSlangCst();

  _queries = {
    constructor: Query.create("@ctor [ConstructorDefinition]"),
    contractDef: Query.create("@c [ContractDefinition]"),
    interfaceDef: Query.create("@c [InterfaceDefinition]"),
    libraryDef: Query.create("@c [LibraryDefinition]"),
  };

  return _queries;
}

/**
 * Run a set of contract-like queries (ContractDefinition / InterfaceDefinition
 * / LibraryDefinition) against `cursor`'s subtree and return every captured
 * cursor. Caller owns the returned clones.
 */
async function collectContractLikeMatches(
  cursor: Cursor,
  queryKeys: readonly ContractQueryKey[]
): Promise<Cursor[]> {
  const queries = await ensureQueries();
  const c = cursor.clone();
  const matches = c.query(queryKeys.map((k) => queries[k]));

  const result: Cursor[] = [];
  let match;

  while ((match = matches.next())) {
    const cursors = match.captures.c;

    if (cursors === undefined) {
      continue;
    }

    for (const mc of cursors) {
      result.push(mc.clone());
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Inheritance resolution
// ---------------------------------------------------------------------------

/**
 * Information about a resolved parent contract/interface from an inheritance chain.
 */
export interface ResolvedParent {
  /** Cursor pointing at the parent contract/interface CST node */
  cursor: Cursor;
  /** The NonterminalNode for the parent */
  node: NonterminalNode;
  /** The file ID (URI) where the parent is defined */
  fileId: string;
}

/**
 * Resolve all inherited contracts/interfaces from a contract CST node.
 * Walks descendants for InheritanceType nodes, then resolves each
 * IdentifierPath via BindingGraph.
 */
export function getInheritedContracts(
  unit: CompilationUnit,
  contractCursor: Cursor
): ResolvedParent[] {
  const results: ResolvedParent[] = [];

  const inheritanceTypes = findAllDescendants(
    contractCursor,
    (c) => c.node.isNonterminalNode() && c.node.kind === "InheritanceType"
  );

  for (const it of inheritanceTypes) {
    const pathCursor = findFirstDescendant(
      it,
      (c) => c.node.isNonterminalNode() && c.node.kind === "IdentifierPath"
    );

    if (pathCursor === undefined) {
      continue;
    }

    const resolved = resolveIdentifierPathRef(unit, pathCursor);

    if (resolved !== undefined) {
      results.push(...resolved);
    }
  }

  return results;
}

/**
 * Resolve an IdentifierPath CST node via BindingGraph.
 * Finds the last Identifier terminal, calls referenceAt(), follows to
 * definiensLocation. Returns all resolved parents (usually 1).
 */
export function resolveIdentifierPathRef(
  unit: CompilationUnit,
  identPathCursor: Cursor
): ResolvedParent[] | undefined {
  const idents = findAllDescendants(
    identPathCursor,
    (c) => c.node.isTerminalNode() && c.node.kind === "Identifier"
  );

  if (idents.length === 0) {
    return undefined;
  }

  const lastIdentCursor = idents[idents.length - 1];
  const ref = unit.bindingGraph.referenceAt(lastIdentCursor);

  if (ref === undefined) {
    return undefined;
  }

  const defs = ref.definitions();
  const results: ResolvedParent[] = [];

  for (const def of defs) {
    const loc = def.definiensLocation;

    if (loc.isUserFileLocation()) {
      const node = loc.cursor.node.asNonterminalNode();

      if (node !== undefined) {
        results.push({ cursor: loc.cursor, node, fileId: loc.fileId });
      }
    }
  }

  return results.length > 0 ? results : undefined;
}

// ---------------------------------------------------------------------------
// Contract finding via CST queries
// ---------------------------------------------------------------------------

/**
 * Find the innermost ContractDefinition, InterfaceDefinition, or LibraryDefinition
 * containing the given line/column position.
 * Solidity doesn't permit nested contracts/interfaces/libraries, so the
 * latest-starting candidate that contains the position is the innermost one.
 */
export async function findEnclosingContractAtPosition(
  cursor: Cursor,
  line: number,
  column: number
): Promise<Cursor | undefined> {
  const candidates = await collectContractLikeMatches(cursor, [
    "contractDef",
    "interfaceDef",
    "libraryDef",
  ]);

  let best: Cursor | undefined;
  let bestStartLine = -Infinity;
  let bestStartColumn = -Infinity;

  for (const mc of candidates) {
    const range = mc.textRange;
    const containsPosition =
      (line > range.start.line ||
        (line === range.start.line && column >= range.start.column)) &&
      (line < range.end.line ||
        (line === range.end.line && column <= range.end.column));

    if (!containsPosition) {
      continue;
    }

    if (
      range.start.line > bestStartLine ||
      (range.start.line === bestStartLine &&
        range.start.column > bestStartColumn)
    ) {
      best = mc;
      bestStartLine = range.start.line;
      bestStartColumn = range.start.column;
    }
  }

  return best;
}

/**
 * Find a ContractDefinition or InterfaceDefinition CST node whose UTF-8
 * range contains the given byte offset.
 */
export async function findContractAtByteOffset(
  cursor: Cursor,
  targetOffset: number
): Promise<Cursor | undefined> {
  const candidates = await collectContractLikeMatches(cursor, [
    "contractDef",
    "interfaceDef",
  ]);

  for (const mc of candidates) {
    const r = mc.textRange;

    if (r.start.utf8 <= targetOffset && targetOffset < r.end.utf8) {
      return mc;
    }
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Function analysis
// ---------------------------------------------------------------------------

/**
 * Check if a definiens CST node represents an abstract function (no body).
 * A function is abstract if its FunctionBody contains no Block child
 * (just a semicolon terminal), or if it has no FunctionBody at all.
 */
export function isAbstractFunction(definiensNode: Node): boolean {
  if (!definiensNode.isNonterminalNode()) {
    return false;
  }

  const kind = definiensNode.kind;

  if (
    kind !== "FunctionDefinition" &&
    kind !== "ReceiveFunctionDefinition" &&
    kind !== "FallbackFunctionDefinition" &&
    kind !== "UnnamedFunctionDefinition"
  ) {
    return false;
  }

  const children = definiensNode.children();

  for (const child of children) {
    if (child.node.isNonterminalNode() && child.node.kind === "FunctionBody") {
      const bodyChildren = child.node.children();

      for (const bodyChild of bodyChildren) {
        if (
          bodyChild.node.isNonterminalNode() &&
          bodyChild.node.kind === "Block"
        ) {
          return false;
        }
      }

      return true;
    }
  }

  return true;
}

/**
 * Find a ConstructorDefinition CST node within a contract.
 */
export async function findConstructorInContract(
  contractCursor: Cursor
): Promise<Cursor | undefined> {
  const queries = await ensureQueries();
  const c = contractCursor.clone();
  const matches = c.query([queries.constructor]);

  const match = matches.next();

  if (!match) {
    return undefined;
  }

  const ctors = match.captures.ctor;

  if (ctors === undefined || ctors.length === 0) {
    return undefined;
  }

  return ctors[0].clone();
}

// ---------------------------------------------------------------------------
// Contract name resolution
// ---------------------------------------------------------------------------

/**
 * Find the Identifier cursor for the name of a contract-like CST node
 * (ContractDefinition, InterfaceDefinition, LibraryDefinition). Restricted
 * to direct children — an Identifier deeper inside the contract body
 * (e.g. in inheritance or members) would not be the name.
 */
export function findContractNameIdentifier(
  contractCursor: Cursor
): Cursor | undefined {
  const c = contractCursor.clone();

  if (!c.goToFirstChild()) {
    return undefined;
  }

  do {
    if (c.node.isTerminalNode() && c.node.kind === "Identifier") {
      return c.clone();
    }
  } while (c.goToNextSibling());

  return undefined;
}

/**
 * Walk up from a cursor to find the enclosing ContractDefinition,
 * InterfaceDefinition, or LibraryDefinition, then return the cursor
 * positioned at that node (not at its name).
 */
export function findEnclosingContractCursor(
  cursor: Cursor
): Cursor | undefined {
  const c = cursor.clone();

  while (c.goToParent()) {
    if (c.node.isNonterminalNode()) {
      const kind = c.node.kind;

      if (
        kind === "ContractDefinition" ||
        kind === "InterfaceDefinition" ||
        kind === "LibraryDefinition"
      ) {
        return c.clone();
      }
    }
  }

  return undefined;
}

/**
 * The ConstructorDefinition a cursor names, when the cursor is on the
 * `constructor` keyword itself.
 *
 * A constructor has no name in the grammar — `ConstructorDefinition` is
 * `CONSTRUCTOR_KEYWORD ParametersDeclaration ConstructorAttributes Block` — so
 * there is no identifier terminal for the binding graph to bind, and
 * `definitionAt`/`referenceAt` can never resolve a cursor on the keyword.
 * Anything that wants the constructor has to walk the CST.
 *
 * Only the keyword counts. A position inside the parameters or the body is
 * asking about whatever is under it, not about the constructor.
 */
export function findConstructorFromKeyword(cursor: Cursor): Cursor | undefined {
  if (
    !cursor.node.isTerminalNode() ||
    cursor.node.kind !== "ConstructorKeyword"
  ) {
    return undefined;
  }

  const c = cursor.clone();

  while (c.goToParent()) {
    if (c.node.isNonterminalNode() && c.node.kind === "ConstructorDefinition") {
      return c.clone();
    }
  }

  return undefined;
}

/**
 * Whether a cursor sits inside the type name of a `new X(...)` expression.
 *
 * The binding graph resolves that `X` to the contract, which is right for the
 * name but not for a hover: what the reader is asking about is the thing being
 * called, which is the constructor.
 */
export function isInsideNewExpression(cursor: Cursor): boolean {
  const c = cursor.clone();

  while (c.goToParent()) {
    if (c.node.isNonterminalNode()) {
      if (c.node.kind === "NewExpression") {
        return true;
      }

      // `new` applies directly to the type name, so a statement boundary means
      // we have walked out past any new expression.
      if (c.node.kind === "Statement") {
        return false;
      }
    }
  }

  return false;
}

/**
 * Walk up from a cursor to the enclosing contract-like definition and
 * return the cursor at its name Identifier.
 */
export function findEnclosingContractNameIdentifier(
  cursor: Cursor
): Cursor | undefined {
  const contractCursor = findEnclosingContractCursor(cursor);

  if (contractCursor === undefined) {
    return undefined;
  }

  return findContractNameIdentifier(contractCursor);
}

/**
 * Walk up from a cursor to the enclosing contract-like definition and
 * resolve its name via BindingGraph.
 */
export function findEnclosingContractDefinition(
  cursor: Cursor,
  unit: CompilationUnit
): Definition | undefined {
  const nameCursor = findEnclosingContractNameIdentifier(cursor);

  if (nameCursor === undefined) {
    return undefined;
  }

  return unit.bindingGraph.definitionAt(nameCursor);
}

/**
 * Check whether a contract (identified by `contractCursor` pointing to its
 * ContractDefinition/InterfaceDefinition/LibraryDefinition node) inherits,
 * directly or transitively, from a contract whose BindingGraph definition
 * has the given `ancestorDefId`.
 *
 * Walks the inheritance chain via `getInheritedContracts`. Does NOT count
 * type-use, `using X for Y`, instantiation, or other non-inheritance
 * references — only true inheritance specifiers.
 *
 * Cycle safety: `visited` tracks every parent definition id we've already
 * enqueued, so even malformed source that has a contract inheriting from
 * itself (transitively) terminates instead of looping forever.
 */
export function isContractInheritingFrom(
  unit: CompilationUnit,
  contractCursor: Cursor,
  ancestorDefId: number
): boolean {
  const visited = new Set<number>();
  const queue: Cursor[] = [contractCursor];

  while (queue.length > 0) {
    const current = queue.shift() as Cursor;
    const parents = getInheritedContracts(unit, current);

    for (const parent of parents) {
      const parentNameCursor = findContractNameIdentifier(parent.cursor);

      if (parentNameCursor === undefined) {
        continue;
      }

      const parentDef = unit.bindingGraph.definitionAt(parentNameCursor);

      if (parentDef === undefined) {
        continue;
      }

      if (parentDef.id === ancestorDefId) {
        return true;
      }

      if (!visited.has(parentDef.id)) {
        visited.add(parentDef.id);
        queue.push(parent.cursor);
      }
    }
  }

  return false;
}

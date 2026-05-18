/**
 * Shared CST traversal helpers for Slang.
 *
 * Uses Slang's Query API for declarative CST matching wherever possible,
 * with cursor-based walk-up patterns where queries don't apply.
 */
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with { "resolution-mode": "import" };
import type {
  Cursor,
  Node,
  NonterminalNode,
  Query,
} from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import type { Definition } from "@nomicfoundation/slang/bindings" with { "resolution-mode": "import" };

// ---------------------------------------------------------------------------
// Cached queries (created lazily on first use)
// ---------------------------------------------------------------------------

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

  const { Query } = await import("@nomicfoundation/slang/cst");

  _queries = {
    constructor: Query.create("@ctor [ConstructorDefinition]"),
    contractDef: Query.create("@c [ContractDefinition]"),
    interfaceDef: Query.create("@c [InterfaceDefinition]"),
    libraryDef: Query.create("@c [LibraryDefinition]"),
  };

  return _queries;
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
 * Uses flat pre-order traversal to find InheritanceType nodes, then resolves
 * each IdentifierPath via BindingGraph. Handles all CST shapes automatically.
 */
export function getInheritedContracts(
  unit: CompilationUnit,
  contractCursor: Cursor
): ResolvedParent[] {
  const c = contractCursor.spawn();
  const results: ResolvedParent[] = [];

  while (c.goToNext()) {
    if (!c.node.isNonterminalNode() || c.node.kind !== "InheritanceType") {
      continue;
    }

    // Within InheritanceType, find the first IdentifierPath (the type name)
    const tc = c.spawn();

    while (tc.goToNext()) {
      if (tc.node.isNonterminalNode() && tc.node.kind === "IdentifierPath") {
        const resolved = resolveIdentifierPathRef(unit, tc);

        if (resolved !== undefined) {
          results.push(...resolved);
        }

        break;
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// IdentifierPath resolution
// ---------------------------------------------------------------------------

/**
 * Resolve an IdentifierPath CST node via BindingGraph.
 * Finds the last Identifier terminal, calls referenceAt(), follows to
 * definiensLocation. Returns all resolved parents (usually 1).
 */
export function resolveIdentifierPathRef(
  unit: CompilationUnit,
  identPathCursor: Cursor
): ResolvedParent[] | undefined {
  const c = identPathCursor.spawn();
  let lastIdentCursor: Cursor | undefined;

  while (c.goToNext()) {
    if (c.node.isTerminalNode() && c.node.kind === "Identifier") {
      lastIdentCursor = c.clone();
    }
  }

  if (lastIdentCursor === undefined) {
    return undefined;
  }

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
// Contract finding
// ---------------------------------------------------------------------------

/**
 * Find the innermost ContractDefinition, InterfaceDefinition, or LibraryDefinition
 * containing the given line/column position.
 * Uses Query API to find all contract-like nodes, then picks the smallest.
 */
export async function findEnclosingContractAtPosition(
  cursor: Cursor,
  line: number,
  column: number
): Promise<Cursor | undefined> {
  const queries = await ensureQueries();
  const c = cursor.clone();
  const allMatches = c.query([
    queries.contractDef,
    queries.interfaceDef,
    queries.libraryDef,
  ]);

  let best: Cursor | undefined;
  let bestSize = Infinity;

  let match;

  while ((match = allMatches.next())) {
    const cursors = match.captures.c;

    if (cursors === undefined) {
      continue;
    }

    for (const mc of cursors) {
      const range = mc.textRange;
      const containsPosition =
        (line > range.start.line ||
          (line === range.start.line && column >= range.start.column)) &&
        (line < range.end.line ||
          (line === range.end.line && column <= range.end.column));

      if (containsPosition) {
        const size =
          (range.end.line - range.start.line) * 10000 +
          (range.end.column - range.start.column);

        if (size < bestSize) {
          best = mc.clone();
          bestSize = size;
        }
      }
    }
  }

  return best;
}

/**
 * Find a ContractDefinition or InterfaceDefinition CST node
 * whose range contains the given UTF-8 byte offset.
 * Uses Query API to find all contract nodes, then filters by offset.
 */
export async function findContractAtByteOffset(
  cursor: Cursor,
  targetOffset: number
): Promise<Cursor | undefined> {
  const queries = await ensureQueries();
  const c = cursor.clone();
  const allMatches = c.query([queries.contractDef, queries.interfaceDef]);

  let match;

  while ((match = allMatches.next())) {
    const cursors = match.captures.c;

    if (cursors === undefined) {
      continue;
    }

    for (const mc of cursors) {
      const r = mc.textRange;

      if (r.start.utf8 <= targetOffset && targetOffset < r.end.utf8) {
        return mc.clone();
      }
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
    if (
      child.node.isNonterminalNode() &&
      child.node.kind === "FunctionBody"
    ) {
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
 * Uses Query API to declaratively match ConstructorDefinition at any depth.
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
 * (ContractDefinition, InterfaceDefinition, LibraryDefinition).
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
 * Walk up from a cursor to find the enclosing ContractDefinition,
 * InterfaceDefinition, or LibraryDefinition, then return the cursor
 * at its name Identifier.
 */
export function findEnclosingContractNameIdentifier(
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
        return findContractNameIdentifier(c);
      }
    }
  }

  return undefined;
}

/**
 * Walk up from a cursor to find the enclosing ContractDefinition or
 * InterfaceDefinition, then resolve its name via BindingGraph.
 * Returns the BindingGraph definition object, or undefined.
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

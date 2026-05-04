import {
  ImplementationParams,
  Location,
} from "vscode-languageserver/node";
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with { "resolution-mode": "import" };
import type {
  Cursor,
  TerminalKindExtensions as TerminalKindExtensionsType,
} from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import type { Definition } from "@nomicfoundation/slang/bindings" with { "resolution-mode": "import" };
import { ServerState } from "../../types";
import { onCommand } from "../../utils/onCommand";
import {
  findEnclosingContractCursor,
  findEnclosingContractDefinition,
  getSlangCst,
  isAbstractFunction,
  isContractInheritingFrom,
  resolveIdentifierAtPosition,
  resolveToDefinition,
  userFileLocationToLSPLocation,
} from "../../parser/slangHelpers";

export const onImplementation = (serverState: ServerState) => {
  return onCommand<ImplementationParams, Location[] | null>(
    serverState,
    (unit, uri, params) => findImplementation(unit, uri, params),
    null
  );
};

async function findImplementation(
  unit: CompilationUnit,
  internalUri: string,
  params: ImplementationParams
): Promise<Location[] | null> {
  const { TerminalKindExtensions } = await getSlangCst();

  const resolution = await resolveIdentifierAtPosition(
    unit,
    internalUri,
    params.position.line,
    params.position.character
  );

  if (resolution === undefined) {
    return null;
  }

  const definition = resolveToDefinition(resolution);

  if (definition === undefined) {
    return null;
  }

  const results: Location[] = [];
  const seenKeys = new Set<string>();

  const addLocation = (loc: Location) => {
    const key = `${loc.uri}:${loc.range.start.line}:${loc.range.start.character}`;

    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      results.push(loc);
    }
  };

  // Include the definition itself (if not abstract)
  const definiensLocation = definition.definiensLocation;

  if (definiensLocation.isUserFileLocation()) {
    if (!isAbstractFunction(definiensLocation.cursor.node)) {
      const nameLocation = definition.nameLocation;

      if (nameLocation.isUserFileLocation()) {
        addLocation(userFileLocationToLSPLocation(nameLocation));
      }
    }
  }

  // Walk all references to this definition
  const refs = definition.references();

  for (const ref of refs) {
    const refLocation = ref.location;

    if (!refLocation.isUserFileLocation()) {
      continue;
    }

    // Check if this reference is also a definition (e.g., an override)
    const refDef = unit.bindingGraph.definitionAt(refLocation.cursor);

    if (refDef !== undefined) {
      const refDefiniensLocation = refDef.definiensLocation;

      if (
        refDefiniensLocation.isUserFileLocation() &&
        !isAbstractFunction(refDefiniensLocation.cursor.node)
      ) {
        const refNameLocation = refDef.nameLocation;

        if (refNameLocation.isUserFileLocation()) {
          addLocation(userFileLocationToLSPLocation(refNameLocation));
        }
      }

      continue;
    }

    // Check if this reference is in a type context (TypeName ancestor)
    if (isInTypeNameContext(refLocation.cursor)) {
      addLocation(userFileLocationToLSPLocation(refLocation));
    }
  }

  // For abstract/interface functions, the BindingGraph does NOT link concrete
  // overrides as references of the abstract definition — each override is a
  // separate definition with the same name. Scan every file in the unit for
  // matching identifiers whose enclosing contract transitively inherits from
  // the abstract's contract.
  if (
    definiensLocation.isUserFileLocation() &&
    isAbstractFunction(definiensLocation.cursor.node) &&
    results.length === 0
  ) {
    const funcName = definition.nameLocation.isUserFileLocation()
      ? definition.nameLocation.cursor.node.unparse()
      : undefined;

    if (funcName !== undefined) {
      for (const file of unit.files()) {
        // Pre-filter: files whose source text doesn't contain the function
        // name as a substring can't possibly have a matching identifier.
        if (!file.tree.unparse().includes(funcName)) {
          continue;
        }

        findConcreteImplementations(
          file.createTreeCursor(),
          funcName,
          unit,
          TerminalKindExtensions,
          addLocation,
          definition
        );
      }
    }
  }

  return results.length > 0 ? results : [];
}

/**
 * Check if the cursor sits inside a TypeName nonterminal.
 */
function isInTypeNameContext(cursor: Cursor): boolean {
  for (const ancestor of cursor.ancestors()) {
    if (ancestor.kind === "TypeName") {
      return true;
    }
  }

  return false;
}

/**
 * Scan a tree cursor for Identifier terminals with the given name and
 * record any that resolve to a concrete (non-abstract) function whose
 * enclosing contract inherits (transitively) from the abstract function's
 * parent contract.
 */
function findConcreteImplementations(
  cursor: Cursor,
  funcName: string,
  unit: CompilationUnit,
  TerminalKindExtensions: typeof TerminalKindExtensionsType,
  addLocation: (loc: Location) => void,
  originalDefinition: Definition
): void {
  const originalDefId = originalDefinition.id;

  const nameLocation = originalDefinition.nameLocation;
  const parentContractDef = nameLocation.isUserFileLocation()
    ? findEnclosingContractDefinition(nameLocation.cursor, unit)
    : undefined;
  const parentContractDefId: number | undefined = parentContractDef?.id;

  const c = cursor.spawn();

  while (c.goToNext()) {
    if (!c.node.isTerminalNode()) {
      continue;
    }

    if (
      !TerminalKindExtensions.isIdentifier(c.node.kind) ||
      c.node.unparse() !== funcName
    ) {
      continue;
    }

    const def = unit.bindingGraph.definitionAt(c);

    if (def === undefined || def.id === originalDefId) {
      continue;
    }

    const defLoc = def.definiensLocation;

    if (
      !defLoc.isUserFileLocation() ||
      isAbstractFunction(defLoc.cursor.node)
    ) {
      continue;
    }

    if (parentContractDefId !== undefined) {
      const candidateContractCursor = findEnclosingContractCursor(c);

      if (
        candidateContractCursor === undefined ||
        !isContractInheritingFrom(unit, candidateContractCursor, parentContractDefId)
      ) {
        continue;
      }
    }

    const nameLoc = def.nameLocation;

    if (nameLoc.isUserFileLocation()) {
      addLocation(userFileLocationToLSPLocation(nameLoc));
    }
  }
}

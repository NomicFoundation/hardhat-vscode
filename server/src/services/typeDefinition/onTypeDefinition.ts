import { Location, TypeDefinitionParams } from "vscode-languageserver/node";
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with { "resolution-mode": "import" };
import { ServerState } from "../../types";
import { onCommand } from "../../utils/onCommand";
import {
  resolveIdentifierAtPosition,
  resolveToDefinition,
  userFileLocationToLSPLocation,
} from "../../parser/slangHelpers";

export const onTypeDefinition = (serverState: ServerState) => {
  return onCommand<TypeDefinitionParams, Location[] | null>(
    serverState,
    findTypeDefinition,
    null
  );
};

async function findTypeDefinition(
  unit: CompilationUnit,
  internalUri: string,
  params: TypeDefinitionParams
): Promise<Location[] | null> {
  const { TerminalKindExtensions, NonterminalKind } = await import(
    "@nomicfoundation/slang/cst"
  );

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

  const definiensLocation = definition.definiensLocation;

  if (!definiensLocation.isUserFileLocation()) {
    return null;
  }

  // Check the kind of the definiens node to determine if the definition IS a type
  const definiensNode = definiensLocation.cursor.node;

  if (definiensNode.isNonterminalNode()) {
    const typeDefinitionKinds = new Set([
      NonterminalKind.StructDefinition,
      NonterminalKind.ContractDefinition,
      NonterminalKind.InterfaceDefinition,
      NonterminalKind.LibraryDefinition,
      NonterminalKind.EnumDefinition,
    ]);

    if (typeDefinitionKinds.has(definiensNode.kind)) {
      // The definition IS a type — return its own name location
      const nameLocation = definition.nameLocation;

      if (nameLocation.isUserFileLocation()) {
        return [userFileLocationToLSPLocation(nameLocation)];
      }

      return null;
    }
  }

  // For variable/function definitions, walk the definiens CST to find type references
  const walker = definiensLocation.cursor.spawn();
  const results: Location[] = [];
  const seenDefIds = new Set<number>();

  // Walk all descendants in pre-order
  while (walker.goToNext()) {
    const node = walker.node;

    // Skip function/block bodies to only capture signature types
    if (
      node.isNonterminalNode() &&
      (node.kind === NonterminalKind.FunctionBody ||
        node.kind === NonterminalKind.Block)
    ) {
      walker.goToNextNonDescendant();
      continue;
    }

    // Only interested in identifier terminals
    if (
      !node.isTerminalNode() ||
      !TerminalKindExtensions.isIdentifier(node.kind)
    ) {
      continue;
    }

    // Try to resolve as a reference
    const ref = unit.bindingGraph.referenceAt(walker);

    if (ref === undefined) {
      continue;
    }

    const defs = ref.definitions();

    for (const def of defs) {
      if (seenDefIds.has(def.id)) {
        continue;
      }

      seenDefIds.add(def.id);

      const nameLocation = def.nameLocation;

      if (nameLocation.isUserFileLocation()) {
        results.push(userFileLocationToLSPLocation(nameLocation));
      }
    }
  }

  return results.length > 0 ? results : null;
}

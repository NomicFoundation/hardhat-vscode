import { Location, TypeDefinitionParams } from "vscode-languageserver/node";
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with { "resolution-mode": "import" };
import type { Cursor } from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
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
  const { NonterminalKind, TerminalKindExtensions } = await import(
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

  const definiensNode = definiensLocation.cursor.node;

  // If the definition IS itself a user-defined type, that's the type definition.
  if (definiensNode.isNonterminalNode()) {
    const typeKinds = new Set([
      NonterminalKind.StructDefinition,
      NonterminalKind.ContractDefinition,
      NonterminalKind.InterfaceDefinition,
      NonterminalKind.LibraryDefinition,
      NonterminalKind.EnumDefinition,
      NonterminalKind.UserDefinedValueTypeDefinition,
    ]);

    if (typeKinds.has(definiensNode.kind)) {
      const nameLocation = definition.nameLocation;

      if (nameLocation.isUserFileLocation()) {
        return [userFileLocationToLSPLocation(nameLocation)];
      }

      return null;
    }
  }

  // Otherwise the definition is something with a declared type (variable,
  // parameter, struct member, state variable, function). Walk only the
  // *type-positioned* children of the definiens — never the body or
  // attributes — and resolve identifier paths inside them.
  const typePositionKinds = new Set([
    NonterminalKind.TypeName,
    NonterminalKind.ReturnsDeclaration,
  ]);

  const results: Location[] = [];
  const seenDefIds = new Set<number>();

  const cursor = definiensLocation.cursor.spawn();

  while (cursor.goToNext()) {
    if (!cursor.node.isNonterminalNode()) {
      continue;
    }

    if (!typePositionKinds.has(cursor.node.kind)) {
      continue;
    }

    collectIdentifierTargets(
      cursor.spawn(),
      unit,
      TerminalKindExtensions,
      seenDefIds,
      results
    );

    // Don't descend into nested TypeName children twice — outer walk continues
    // past this subtree.
    cursor.goToNextNonDescendant();
  }

  return results.length > 0 ? results : null;
}

/**
 * Walk a typeName-or-returns subtree and resolve each identifier terminal
 * via the BindingGraph, accumulating their definition name locations.
 */
function collectIdentifierTargets(
  cursor: Cursor,
  unit: CompilationUnit,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TerminalKindExtensions: any,
  seenDefIds: Set<number>,
  results: Location[]
): void {
  while (cursor.goToNext()) {
    const node = cursor.node;

    if (
      !node.isTerminalNode() ||
      !TerminalKindExtensions.isIdentifier(node.kind)
    ) {
      continue;
    }

    const ref = unit.bindingGraph.referenceAt(cursor);

    if (ref === undefined) {
      continue;
    }

    for (const def of ref.definitions()) {
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
}

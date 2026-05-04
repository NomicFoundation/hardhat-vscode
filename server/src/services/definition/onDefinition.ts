import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with { "resolution-mode": "import" };
import { DefinitionParams, Location } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { onCommand } from "../../utils/onCommand";
import {
  getCursorAtPosition,
  resolveIdentifierFromCursor,
  resolveImportPathNavigation,
  userFileLocationToLSPLocation,
} from "../../parser/slangHelpers";

export const onDefinition = (serverState: ServerState) => {
  return onCommand<DefinitionParams, Location | Location[] | undefined>(
    serverState,
    (unit, uri, params) =>
      findDefinition(serverState, unit, uri, params),
    undefined
  );
};

async function findDefinition(
  serverState: ServerState,
  unit: CompilationUnit,
  internalUri: string,
  params: DefinitionParams
): Promise<Location | Location[] | undefined> {
  const { TerminalKind } = await import("@nomicfoundation/slang/cst");

  const cursor = getCursorAtPosition(
    unit,
    internalUri,
    params.position.line,
    params.position.character
  );

  if (cursor === undefined || !cursor.node.isTerminalNode()) {
    return undefined;
  }

  // Handle import path string navigation
  if (
    cursor.node.kind === TerminalKind.SingleQuotedStringLiteral ||
    cursor.node.kind === TerminalKind.DoubleQuotedStringLiteral
  ) {
    return resolveImportPathNavigation(serverState, unit, cursor, internalUri);
  }

  const resolution = await resolveIdentifierFromCursor(unit, cursor);

  if (resolution === undefined) {
    return undefined;
  }

  // Try as a reference first (most common case: cursor on a usage)
  if (resolution.reference !== undefined) {
    const definitions = resolution.reference.definitions();

    if (definitions.length > 0) {
      const locations: Location[] = [];

      for (const def of definitions) {
        const nameLocation = def.nameLocation;

        if (nameLocation.isUserFileLocation()) {
          locations.push(userFileLocationToLSPLocation(nameLocation));
        }
      }

      if (locations.length === 1) {
        return locations[0];
      }

      if (locations.length > 1) {
        return locations;
      }

      return undefined;
    }
  }

  // Try as a definition (cursor already on the definition)
  if (resolution.definition !== undefined) {
    const nameLocation = resolution.definition.nameLocation;

    if (nameLocation.isUserFileLocation()) {
      return userFileLocationToLSPLocation(nameLocation);
    }
  }

  return undefined;
}

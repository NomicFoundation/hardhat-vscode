import { VSCodeLocation } from "@common/types";
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with { "resolution-mode": "import" };
import { ReferenceParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { toUri } from "../../utils";
import { onCommand } from "../../utils/onCommand";
import {
  collectAllDefinitions,
  findEnclosingContractNameIdentifier,
  getCursorAtPosition,
  getSlangCst,
  resolveIdentifierFromCursor,
  toVSCodeRange,
  userFileLocationToLSPLocation,
} from "../../parser/slangHelpers";

export const onReferences = (serverState: ServerState) => {
  return onCommand<ReferenceParams, VSCodeLocation[]>(
    serverState,
    (unit, uri, params) => findReferences(unit, uri, params),
    []
  );
};

async function findReferences(
  unit: CompilationUnit,
  internalUri: string,
  params: ReferenceParams
): Promise<VSCodeLocation[]> {
  const cursor = getCursorAtPosition(
    unit,
    internalUri,
    params.position.line,
    params.position.character
  );

  if (cursor === undefined || !cursor.node.isTerminalNode()) {
    return [];
  }

  // For constructor keyword, resolve to the parent contract's name
  let resolvedCursor = cursor;

  const { TerminalKindExtensions } = await getSlangCst();

  if (!TerminalKindExtensions.isIdentifier(cursor.node.kind)) {
    if (cursor.node.kind === "ConstructorKeyword") {
      const contractNameCursor = findEnclosingContractNameIdentifier(cursor);

      if (contractNameCursor === undefined) {
        return [];
      }

      resolvedCursor = contractNameCursor;
    } else {
      return [];
    }
  }

  const resolution = await resolveIdentifierFromCursor(
    unit,
    resolvedCursor
  );

  if (resolution === undefined) {
    return [];
  }

  const uniqueDefs = collectAllDefinitions(resolution);

  if (uniqueDefs.length === 0) {
    return [];
  }

  // Collect all reference locations
  const locations: VSCodeLocation[] = [];

  // If the original cursor was on a constructor keyword, include it as a reference
  if (cursor.node.kind === "ConstructorKeyword") {
    const range = cursor.textRange;

    locations.push({
      uri: toUri(internalUri),
      range: toVSCodeRange(range),
    });
  }

  for (const def of uniqueDefs) {
    // Include the definition itself if includeDeclaration is requested
    if (params.context.includeDeclaration) {
      const nameLocation = def.nameLocation;

      if (nameLocation.isUserFileLocation()) {
        locations.push(userFileLocationToLSPLocation(nameLocation));
      }
    }

    // Include all references
    for (const ref of def.references()) {
      const refLocation = ref.location;

      if (refLocation.isUserFileLocation()) {
        locations.push(userFileLocationToLSPLocation(refLocation));
      }
    }
  }

  return locations;
}

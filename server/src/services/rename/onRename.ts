import { RenameParams } from "vscode-languageserver/node";
import { WorkspaceEdit, TextEdit } from "@common/types";
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with {
  "resolution-mode": "import",
};
import { ServerState } from "../../types";
import { toUri } from "../../utils";
import { onCommand } from "../../utils/onCommand";
import {
  resolveIdentifierAtPosition,
  collectAllDefinitions,
  toVSCodeRange,
} from "../../parser/slangHelpers";

export const onRename = (serverState: ServerState) => {
  return onCommand<RenameParams, WorkspaceEdit>(
    serverState,
    (unit, uri, params) => rename(unit, uri, params),
    { changes: {} }
  );
};

async function rename(
  unit: CompilationUnit,
  internalUri: string,
  params: RenameParams
): Promise<WorkspaceEdit> {
  const definitions = await resolveIdentifierAtPosition(
    unit,
    internalUri,
    params.position.line,
    params.position.character
  );

  if (definitions === undefined) {
    return { changes: {} };
  }

  const uniqueDefs = collectAllDefinitions(definitions);

  if (uniqueDefs.length === 0) {
    return { changes: {} };
  }

  const changes: { [uri: string]: TextEdit[] } = {};

  for (const def of uniqueDefs) {
    const nameLocation = def.nameLocation;

    // Add the definition location
    if (nameLocation.isUserFileLocation()) {
      const defUri = toUri(nameLocation.fileId);
      const range = toVSCodeRange(nameLocation.cursor.textRange);

      if (changes[defUri] === undefined) {
        changes[defUri] = [];
      }

      changes[defUri].push(TextEdit.replace(range, params.newName));
    }

    // Add all reference locations
    for (const ref of def.references()) {
      const refLocation = ref.location;

      if (refLocation.isUserFileLocation()) {
        const refUri = toUri(refLocation.fileId);
        const range = toVSCodeRange(refLocation.cursor.textRange);

        if (changes[refUri] === undefined) {
          changes[refUri] = [];
        }

        changes[refUri].push(TextEdit.replace(range, params.newName));
      }
    }
  }

  return { changes };
}

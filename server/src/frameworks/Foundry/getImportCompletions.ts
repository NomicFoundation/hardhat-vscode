import {
  CompletionItem,
  CompletionItemKind,
  Position,
} from "vscode-languageserver-types";
import { SolFileIndexMap } from "../../parser/common/types";
import { Remapping } from "./Remapping";

interface ImportCompletionContext {
  remappings: Remapping[];
  solFileIndex: SolFileIndexMap;
}

export function getImportCompletions(
  ctx: ImportCompletionContext,
  position: Position,
  currentImport: string
): CompletionItem[] {
  if (currentImport === "") {
    return _getRemappingKeyCompletions(ctx);
  } else {
    return _getRemappedContractCompletions(ctx, position, currentImport);
  }
}

function _getRemappingKeyCompletions(
  ctx: ImportCompletionContext
): CompletionItem[] {
  return ctx.remappings.map((r) => {
    const strippedKey = r.from.replace(/\/$/, ""); // Remove trailing slash
    return {
      label: strippedKey,
      insertText: strippedKey,

      kind: CompletionItemKind.Module,
      documentation: "Imports the package",
    };
  });
}

function _getRemappedContractCompletions(
  ctx: ImportCompletionContext,
  position: Position,
  currentImport: string
): CompletionItem[] {
  let currentImportRemapped = currentImport;

  for (const remapping of ctx.remappings) {
    if (currentImportRemapped.startsWith(remapping.from)) {
      currentImportRemapped = currentImportRemapped.replace(
        remapping.from,
        remapping.to
      );
      break;
    }
  }

  const fileUris = Object.keys(ctx.solFileIndex).filter((uri) =>
    uri.startsWith(currentImportRemapped)
  );

  const completionLabels = fileUris.map((uri) =>
    uri.replace(currentImportRemapped, "")
  );

  return completionLabels.map((label) => ({
    label,
    insertText: label,

    kind: CompletionItemKind.File,
    documentation: "Imports the package",
  }));
}

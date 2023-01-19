import path from "path";
import {
  CompletionItem,
  CompletionItemKind,
  Position,
} from "vscode-languageserver-types";
import { SolFileIndexMap } from "../../parser/common/types";
import { FoundryProject } from "./FoundryProject";

interface ImportCompletionContext {
  project: FoundryProject;
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
  return ctx.project.remappings.map((r) => {
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

  for (const remapping of ctx.project.remappings) {
    if (currentImportRemapped.startsWith(remapping.from)) {
      const toAbsolutePath = path.join(ctx.project.basePath, remapping.to);
      currentImportRemapped = currentImportRemapped.replace(
        remapping.from,
        toAbsolutePath
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

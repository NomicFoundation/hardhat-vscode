import path from "path";
import {
  CompletionItem,
  CompletionItemKind,
  Position,
} from "vscode-languageserver-types";
import { SolFileIndexMap } from "../../../parser/common/types";
import { replaceFor } from "../../../services/completion/getImportPathCompletion";
import { normalizeSlashes, toUnixStyle } from "../../../utils";

interface ImportCompletionContext {
  basePath: string;
  solFileIndex: SolFileIndexMap;
}

export function getImportCompletions(
  ctx: ImportCompletionContext,
  position: Position,
  currentImport: string
): CompletionItem[] {
  const contractFilePaths =
    currentImport.includes("/") || currentImport.includes(path.sep)
      ? _findNodeModulesContractFilesInIndex(ctx, currentImport)
      : _findNodeModulePackagesInIndex(ctx);

  return contractFilePaths.map((pathFromNodeModules): CompletionItem => {
    const normalizedPath = normalizeSlashes(pathFromNodeModules);

    const completionItem: CompletionItem = {
      label: normalizedPath,
      textEdit: replaceFor(normalizedPath, position, currentImport),

      kind: CompletionItemKind.Module,
      documentation: "Imports the package",
    };

    return completionItem;
  });
}

function _findNodeModulesContractFilesInIndex(
  ctx: ImportCompletionContext,
  currentImport: string
): string[] {
  const nodeModulesPaths = _resolvePotentialNodeModulesPaths(ctx);

  let allContractFilePaths: string[] = [];
  for (const nodeModulesPath of nodeModulesPaths) {
    const basePath = toUnixStyle(path.join(nodeModulesPath, path.sep));

    const basePathWithCurrentImport = toUnixStyle(
      path.join(basePath, currentImport)
    );

    const contractFilePaths = Object.keys(ctx.solFileIndex)
      .filter((fullPath) => fullPath.startsWith(basePathWithCurrentImport))
      .map((fullPath) => fullPath.replace(basePath, ""));

    allContractFilePaths = allContractFilePaths.concat(contractFilePaths);
  }

  return allContractFilePaths;
}

function _resolvePotentialNodeModulesPaths(
  ctx: ImportCompletionContext
): string[] {
  let current = ctx.basePath;
  const nodeModulesPaths = [];

  while (current !== "/") {
    const previous = current;

    const potentialPath = toUnixStyle(path.join(current, "node_modules"));
    nodeModulesPaths.push(potentialPath);

    current = path.resolve(current, "..");

    if (previous === current) {
      break;
    }
  }

  return nodeModulesPaths;
}

function _findNodeModulePackagesInIndex(
  ctx: ImportCompletionContext
): string[] {
  const nodeModulePaths = _resolvePotentialNodeModulesPaths(ctx);

  let modulePackages: string[] = [];
  for (const nodeModulesPath of nodeModulePaths) {
    const allNodeModulePaths = Object.keys(ctx.solFileIndex)
      .filter((p) => p.startsWith(nodeModulesPath))
      .map((p) => p.replace(nodeModulesPath, ""));

    const uniqueFolders = Array.from(
      new Set(allNodeModulePaths.map((p) => p.split("/")[1]))
    );

    modulePackages = modulePackages.concat(uniqueFolders);
  }

  return Array.from(new Set(modulePackages));
}

import * as fs from "fs";
import * as path from "path";
import * as lsp from "vscode-languageserver/node";
import { toUnixStyle } from "../../utils/index";
import {
  CompletionItem,
  CompletionItemKind,
  ImportDirectiveNode,
  VSCodePosition,
} from "@common/types";
import { Logger } from "@utils/Logger";
import { ProjectContext } from "./types";

export function getImportPathCompletion(
  position: VSCodePosition,
  node: ImportDirectiveNode,
  projCtx: ProjectContext,
  { logger }: { logger: Logger }
): CompletionItem[] {
  const currentImport = node.astNode.path.replace("_;", "");
  const importPath = toUnixStyle(path.join(node.realUri, "..", currentImport));

  if (currentImport === "") {
    const relativeImports = getRelativeImportPathCompletions(
      position,
      currentImport,
      importPath,
      node,
      logger
    );

    const indexNodeModuleFolders =
      getIndexedNodeModuleFolderCompletions(projCtx);

    return relativeImports.concat(indexNodeModuleFolders);
  } else if (isRelativeImport(currentImport)) {
    return getRelativeImportPathCompletions(
      position,
      currentImport,
      importPath,
      node,
      logger
    );
  } else {
    return getDirectImportPathCompletions(position, currentImport, projCtx);
  }
}

function isRelativeImport(currentImport: string) {
  return currentImport.startsWith(".");
}

function getRelativeImportPathCompletions(
  position: VSCodePosition,
  currentImport: string,
  importPath: string,
  node: ImportDirectiveNode,
  logger: Logger
): CompletionItem[] {
  if (/[.^\w]\/\.$/.test(currentImport)) {
    return [];
  }

  if (currentImport.endsWith(".sol")) {
    return [];
  }

  let importDir: string;
  let partial: string;
  if (fs.existsSync(importPath)) {
    importDir = importPath;
    partial = "";
  } else {
    importDir = path.dirname(importPath);
    partial = importPath.replace(importDir + "/", "");

    if (!fs.existsSync(importDir)) {
      return [];
    }
  }

  const files = fs
    .readdirSync(importDir)
    .filter((f) => f.startsWith(partial))
    .filter((f) => !node.realUri.endsWith(f));

  return getCompletionsFromFiles(
    position,
    currentImport,
    importDir,
    partial,
    files,
    logger
  );
}

function getIndexedNodeModuleFolderCompletions(
  projCtx: ProjectContext
): CompletionItem[] {
  if (projCtx.project.type === "none" || !projCtx.project.basePath) {
    return [];
  }

  const uniqueFolders = findNodeModulePackagesInIndex(projCtx);

  return uniqueFolders.map(
    (p): CompletionItem => ({
      label: p,
      kind: CompletionItemKind.Folder,
      documentation: "Imports the package",
    })
  );
}

function replaceFor(
  path: string,
  position: VSCodePosition,
  currentImport: string
) {
  const startingPosition = {
    ...position,
    character: position.character - currentImport.length,
  };

  return lsp.TextEdit.replace(
    lsp.Range.create(startingPosition, position),
    path
  );
}

function getDirectImportPathCompletions(
  position: VSCodePosition,
  currentImport: string,
  projCtx: ProjectContext
): CompletionItem[] {
  const contractFilePaths =
    currentImport.includes("/") || currentImport.includes(path.sep)
      ? findNodeModulesContractFilesInIndex(projCtx, currentImport)
      : findNodeModulePackagesInIndex(projCtx);

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

function getCompletionsFromFiles(
  position: VSCodePosition,
  currentImport: string,
  importDir: string,
  partial: string,
  files: string[],
  logger: Logger
): CompletionItem[] {
  const prefixes = resolveImportPrefixes(currentImport);

  return files
    .map((file) => {
      return convertFileToCompletion(
        file,
        position,
        {
          ...prefixes,
          importDir,
          partial,
        },
        logger
      );
    })
    .filter((x): x is CompletionItem => x !== null);
}

function resolveImportPrefixes(currentImport: string) {
  let prefix = "";
  let displayPrefix = "";

  switch (currentImport) {
    case "":
      prefix = "./";
      displayPrefix = "./";
      break;
    case ".":
      prefix = "/";
      displayPrefix = "./";
      break;
    case "./":
      prefix = "";
      displayPrefix = "./";
      break;
    case "..":
      prefix = "/";
      displayPrefix = "../";
      break;
    case "../":
      prefix = "";
      displayPrefix = "../";
      break;
    default:
      prefix = currentImport.endsWith("..") ? "/" : "";
      break;
  }

  return { prefix, displayPrefix };
}

function convertFileToCompletion(
  file: string,
  position: VSCodePosition,
  {
    importDir,
    partial,
    displayPrefix,
    prefix,
  }: {
    importDir: string;
    partial: string;
    displayPrefix: string;
    prefix: string;
  },
  logger: Logger
) {
  try {
    const absolutePath = toUnixStyle(path.join(importDir, file));
    const fileStat = fs.lstatSync(absolutePath);

    const label = `${displayPrefix}${file}`;
    const insertText = `${prefix}${file}`;

    if (fileStat.isFile() && file.slice(-4) === ".sol") {
      if (partial === "") {
        return {
          label,
          insertText,
          kind: CompletionItemKind.File,
          documentation: "Imports the package",
        };
      } else {
        return {
          label,
          textEdit: replaceFor(insertText, position, partial),
          kind: CompletionItemKind.File,
          documentation: "Imports the package",
        };
      }
    } else if (fileStat.isDirectory() && file !== "node_modules") {
      const completionItem: CompletionItem = {
        label,
        insertText,
        kind: CompletionItemKind.Folder,
        documentation: "Imports the package",
      };

      return completionItem;
    }

    return null;
  } catch (err) {
    logger.error(err);
    return null;
  }
}

function findNodeModulePackagesInIndex({
  project,
  solFileIndex,
}: ProjectContext): string[] {
  const basePath = toUnixStyle(path.join(project.basePath, "node_modules"));

  const allNodeModulePaths = Object.keys(solFileIndex)
    .filter((p) => p.startsWith(basePath))
    .map((p) => p.replace(basePath, ""));

  const uniqueFolders = Array.from(
    new Set(allNodeModulePaths.map((p) => p.split("/")[1]))
  );

  return uniqueFolders;
}

function findNodeModulesContractFilesInIndex(
  { project, solFileIndex }: ProjectContext,
  currentImport: string
): string[] {
  const basePath = toUnixStyle(
    path.join(project.basePath, "node_modules", path.sep)
  );
  const basePathWithCurrentImport = toUnixStyle(
    path.join(basePath, currentImport)
  );

  const contractFilePaths = Object.keys(solFileIndex)
    .filter((fullPath) => fullPath.startsWith(basePathWithCurrentImport))
    .map((fullPath) => fullPath.replace(basePath, ""));

  return contractFilePaths;
}

function normalizeSlashes(p: string) {
  return path.sep === "\\" ? p.replace(/\\/g, "/") : p;
}

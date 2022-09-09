import * as fs from "fs";
import * as path from "path";
import * as lsp from "vscode-languageserver/node";
import {
  CompletionItem,
  CompletionItemKind,
  ImportDirectiveNode,
  ISolProject,
  VSCodePosition,
} from "@common/types";
import { Logger } from "@utils/Logger";
import { toUnixStyle } from "../../utils/index";
import { ProjectContext } from "./types";

export function getImportPathCompletion(
  position: VSCodePosition,
  node: ImportDirectiveNode,
  projCtx: ProjectContext,
  { logger }: { logger: Logger }
): CompletionItem[] {
  const currentImport = node.astNode.path.replace("_;", "");
  const importPath = toUnixStyle(path.join(node.realUri, "..", currentImport));

  let items: CompletionItem[];

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

    items = relativeImports.concat(indexNodeModuleFolders);
  } else if (isRelativeImport(currentImport)) {
    items = getRelativeImportPathCompletions(
      position,
      currentImport,
      importPath,
      node,
      logger
    );
  } else {
    items = getDirectImportPathCompletions(position, currentImport, projCtx);
  }

  // Trigger auto-insertion of semicolon after import completion
  for (const item of items) {
    item.command = {
      command: "hardhat.solidity.insertSemicolon",
      arguments: [position],
      title: "",
    };
  }

  return items;
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
    partial = importPath.replace(`${importDir}/`, "");

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
  filePath: string,
  position: VSCodePosition,
  currentImport: string
) {
  const startingPosition = {
    ...position,
    character: position.character - currentImport.length,
  };

  return lsp.TextEdit.replace(
    lsp.Range.create(startingPosition, position),
    filePath
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
  const nodeModulePaths = resolvePotentialNodeModulesPathsFor(project);

  let modulePackages: string[] = [];
  for (const nodeModulesPath of nodeModulePaths) {
    const allNodeModulePaths = Object.keys(solFileIndex)
      .filter((p) => p.startsWith(nodeModulesPath))
      .map((p) => p.replace(nodeModulesPath, ""));

    const uniqueFolders = Array.from(
      new Set(allNodeModulePaths.map((p) => p.split("/")[1]))
    );

    modulePackages = modulePackages.concat(uniqueFolders);
  }

  return Array.from(new Set(modulePackages));
}

function resolvePotentialNodeModulesPathsFor(project: ISolProject): string[] {
  let current = project.basePath;
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

function findNodeModulesContractFilesInIndex(
  { project, solFileIndex }: ProjectContext,
  currentImport: string
): string[] {
  const nodeModulesPaths = resolvePotentialNodeModulesPathsFor(project);

  let allContractFilePaths: string[] = [];
  for (const nodeModulesPath of nodeModulesPaths) {
    const basePath = toUnixStyle(path.join(nodeModulesPath, path.sep));

    const basePathWithCurrentImport = toUnixStyle(
      path.join(basePath, currentImport)
    );

    const contractFilePaths = Object.keys(solFileIndex)
      .filter((fullPath) => fullPath.startsWith(basePathWithCurrentImport))
      .map((fullPath) => fullPath.replace(basePath, ""));

    allContractFilePaths = allContractFilePaths.concat(contractFilePaths);
  }

  return allContractFilePaths;
}

function normalizeSlashes(p: string) {
  return path.sep === "\\" ? p.replace(/\\/g, "/") : p;
}

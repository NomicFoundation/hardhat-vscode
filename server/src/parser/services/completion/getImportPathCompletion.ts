import * as fs from "fs";
import * as path from "path";
import * as lsp from "vscode-languageserver/node";

import {
  CompletionItem,
  CompletionItemKind,
  DocumentsAnalyzerMap,
  ImportDirectiveNode,
  VSCodePosition,
} from "@common/types";
import { Analyzer } from "@analyzer/index";
import { Logger } from "@utils/Logger";

export function getImportPathCompletion(
  position: VSCodePosition,
  node: ImportDirectiveNode,
  { analyzer, logger }: { analyzer: Analyzer; logger: Logger }
): CompletionItem[] {
  const currentImport = node.astNode.path.replace("_;", "");
  const importPath = path.join(node.realUri, "..", currentImport);

  if (currentImport === "") {
    const relativeImports = getRelativeImportPathCompletions(
      position,
      currentImport,
      importPath,
      node,
      logger
    );

    const indexNodeModuleFolders =
      getIndexedNodeModuleFolderCompletions(analyzer);

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
    return getDirectImportPathCompletions(position, currentImport, analyzer);
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

  let importDir: string;
  let partial: string;
  if (fs.existsSync(importPath)) {
    importDir = importPath;
    partial = "";
  } else {
    importDir = path.dirname(importPath);
    partial = importPath.replace(importDir + path.sep, "");

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
  analyzer: Analyzer
): CompletionItem[] {
  const { rootPath, documentsAnalyzer } = analyzer;

  if (!rootPath) {
    return [];
  }

  const uniqueFolders = findNodeModulePackagesInIndex({
    rootPath,
    documentsAnalyzer,
  });

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
  analyzer: Analyzer
): CompletionItem[] {
  const { rootPath, documentsAnalyzer } = analyzer;

  if (!rootPath) {
    return [];
  }

  const contractFilePaths =
    currentImport.includes("/") || currentImport.includes(path.sep)
      ? findNodeModulesContractFilesInIndex(
          { rootPath, documentsAnalyzer },
          currentImport
        )
      : findNodeModulePackagesInIndex({ rootPath, documentsAnalyzer });

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
    const absolutePath = path.join(importDir, file);
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
  rootPath,
  documentsAnalyzer,
}: {
  rootPath: string;
  documentsAnalyzer: DocumentsAnalyzerMap;
}): string[] {
  const basePath = path.join(rootPath, "node_modules");

  const allNodeModulePaths = Object.keys(documentsAnalyzer)
    .filter((p) => p.startsWith(basePath))
    .map((p) => p.replace(basePath, ""));

  const uniqueFolders = Array.from(
    new Set(allNodeModulePaths.map((p) => p.split(path.sep)[1]))
  );

  return uniqueFolders;
}

function findNodeModulesContractFilesInIndex(
  {
    rootPath,
    documentsAnalyzer,
  }: {
    rootPath: string;
    documentsAnalyzer: DocumentsAnalyzerMap;
  },
  currentImport: string
): string[] {
  const basePath = path.join(rootPath, "node_modules", path.sep);
  const basePathWithCurrentImport = path.join(basePath, currentImport);

  const contractFilePaths = Object.keys(documentsAnalyzer)
    .filter((fullPath) => fullPath.startsWith(basePathWithCurrentImport))
    .map((fullPath) => fullPath.replace(basePath, ""));

  return contractFilePaths;
}

function normalizeSlashes(p: string) {
  return path.sep === "\\" ? p.replace(/\\/g, "/") : p;
}

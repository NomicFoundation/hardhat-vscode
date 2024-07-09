/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import * as fs from "fs";
import * as path from "path";
import * as lsp from "vscode-languageserver/node";
import {
  CompletionItem,
  CompletionItemKind,
  ImportDirectiveNode,
  TextDocument,
  VSCodePosition,
} from "@common/types";
import { Logger } from "@utils/Logger";
import { TextDocuments } from "vscode-languageserver/node";
import { isRelativeImport, toUnixStyle, toUri } from "../../utils/index";

import { ProjectContext } from "./types";

export function getImportPathCompletion(
  position: VSCodePosition,
  node: ImportDirectiveNode,
  projCtx: ProjectContext,
  {
    logger,
    documents,
  }: { logger: Logger; documents: TextDocuments<TextDocument> }
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

    const projectImportCompletions = projCtx.project.getImportCompletions(
      position,
      currentImport
    );

    items = relativeImports.concat(projectImportCompletions);
  } else if (isRelativeImport(currentImport)) {
    items = getRelativeImportPathCompletions(
      position,
      currentImport,
      importPath,
      node,
      logger
    );
  } else {
    items = projCtx.project.getImportCompletions(position, currentImport);
  }

  // Append semicolon at the end if it's not already present
  const document = documents.get(toUri(node.realUri));

  const line = document?.getText({
    start: {
      line: position.line,
      character: 0,
    },
    end: {
      line: position.line,
      character: 99999,
    },
  });

  if (!/;\r?\n?$/.test(line ?? "")) {
    for (const item of items) {
      item.additionalTextEdits = [
        {
          range: {
            start: { line: position.line, character: 999 },
            end: { line: position.line, character: 999 },
          },
          newText: ";",
        },
      ];
    }
  }

  return items;
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

export function replaceFor(
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
      // Don't suggest the current import
      if (partial === insertText) {
        return null;
      }

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

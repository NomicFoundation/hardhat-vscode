import { Diagnostic, DiagnosticSeverity, Range } from "@common/types";
import { TextDocument } from "vscode-languageserver-textdocument";
import type { HardhatError, HardhatImportLineError } from "../../types";

export const IMPORT_LINE_ERROR_CODES = [404, 405, 406, 407, 408, 409];

function isHardhatImportLineError(
  error: HardhatError
): error is HardhatImportLineError {
  return IMPORT_LINE_ERROR_CODES.includes(error.errorDescriptor.number);
}

export function convertHardhatErrorToDiagnostic(
  document: TextDocument,
  err: HardhatError
): Diagnostic | null {
  if (!isHardhatImportLineError(err)) {
    return null;
  }

  return resolveImportLineError(document, err, err.errorDescriptor.title);
}

function resolveImportLineError(
  document: TextDocument,
  err: HardhatImportLineError,
  message: string
) {
  const range = findRangeForImport(document, err);

  if (!range) {
    return null;
  }

  return {
    severity: DiagnosticSeverity.Error,
    code: err.errorDescriptor.number,
    source: "hardhat",
    message,
    range,
  };
}

function findRangeForImport(
  document: TextDocument,
  err: HardhatImportLineError
): Range | null {
  const imported = err.messageArguments.imported;

  const startIndex = document.getText().indexOf(imported);

  if (startIndex === -1) {
    return null;
  }

  const endIndex = startIndex + imported.length;

  return {
    start: document.positionAt(startIndex),
    end: document.positionAt(endIndex),
  };
}

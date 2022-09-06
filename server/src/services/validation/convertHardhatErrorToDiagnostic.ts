import { Diagnostic, DiagnosticSeverity, Range } from "@common/types";
import { TextDocument } from "vscode-languageserver-textdocument";
import type {
  HardhatError,
  HardhatImportFileError,
  HardhatImportLibraryError,
} from "../../types";

export const IMPORT_FILE_ERROR_CODES = [404, 405, 406, 407, 408, 409];
export const IMPORT_LIBRARY_ERROR_CODES = [411];

function isHardhatImportFileError(
  error: HardhatError
): error is HardhatImportFileError {
  const errorCode = error?.errorDescriptor?.number;

  return IMPORT_FILE_ERROR_CODES.includes(errorCode);
}

function isHardhatImportLibraryError(
  error: HardhatError
): error is HardhatImportLibraryError {
  const errorCode = error?.errorDescriptor?.number;

  return IMPORT_LIBRARY_ERROR_CODES.includes(errorCode);
}

function getImportString(err: HardhatError) {
  if (isHardhatImportFileError(err)) {
    return err.messageArguments.imported;
  } else if (isHardhatImportLibraryError(err)) {
    return err.messageArguments.library;
  } else {
    return null;
  }
}

export function convertHardhatErrorToDiagnostic(
  document: TextDocument,
  err: HardhatError
): Diagnostic | null {
  const importString = getImportString(err);

  if (importString === null) return null;

  return resolveImportError(document, err, importString);
}

function resolveImportError(
  document: TextDocument,
  err: HardhatError,
  importString: string
) {
  const range = findRangeForImport(document, importString);

  if (!range) {
    return null;
  }

  return {
    severity: DiagnosticSeverity.Error,
    code: err.errorDescriptor.number,
    source: "hardhat",
    message: err.errorDescriptor.title,
    range,
  };
}

function findRangeForImport(
  document: TextDocument,
  importString: string
): Range | null {
  const startIndex = document.getText().indexOf(importString);

  if (startIndex === -1) {
    return null;
  }

  const endIndex = startIndex + importString.length;

  return {
    start: document.positionAt(startIndex),
    end: document.positionAt(endIndex),
  };
}

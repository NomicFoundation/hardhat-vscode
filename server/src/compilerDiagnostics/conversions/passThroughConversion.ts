import { TextDocument, Range, DiagnosticSeverity } from "@common/types";
import { SolcError } from "../../types";

export function passThroughConversion(
  document: TextDocument,
  error: SolcError
) {
  if (!error.sourceLocation) {
    throw new Error("No source location");
  }

  const range = Range.create(
    document.positionAt(error.sourceLocation.start),
    document.positionAt(error.sourceLocation.end)
  );

  return {
    code: error.errorCode,
    source: document.languageId,
    severity:
      error.severity === "error"
        ? DiagnosticSeverity.Error
        : DiagnosticSeverity.Warning,
    message: error.message,
    range,
  };
}

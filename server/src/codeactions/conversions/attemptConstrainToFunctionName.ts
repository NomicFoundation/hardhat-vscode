import {
  TextDocument,
  Diagnostic,
  Range,
  DiagnosticSeverity,
} from "@common/types";
import { HardhatCompilerError } from "../types";
import { passThroughConversion } from "./passThroughConversion";

export function attemptConstrainToFunctionName(
  document: TextDocument,
  error: HardhatCompilerError
): Diagnostic {
  const range = Range.create(
    document.positionAt(error.sourceLocation.start),
    document.positionAt(error.sourceLocation.end)
  );

  const text = document.getText(range);

  const regex = /(?<=function\s+)[^\s]+(?=\s*\()/gm;

  const match = regex.exec(text);

  if (!match) {
    return passThroughConversion(document, error);
  }

  const [functionName] = match;

  const updatedRange = Range.create(
    document.positionAt(error.sourceLocation.start + match.index),
    document.positionAt(
      error.sourceLocation.start + match.index + functionName.length
    )
  );

  return {
    code: error.errorCode,
    source: document.languageId,
    severity:
      error.severity === "error"
        ? DiagnosticSeverity.Error
        : DiagnosticSeverity.Warning,
    message: error.message,
    range: updatedRange,
    data: {
      functionSourceLocation: {
        start: error.sourceLocation.start,
        end: error.sourceLocation.end,
      },
    },
  };
}

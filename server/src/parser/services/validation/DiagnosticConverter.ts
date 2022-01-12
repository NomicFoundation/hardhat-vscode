import { Analyzer } from "@analyzer/index";
import {
  TextDocument,
  Diagnostic,
  Range,
  DiagnosticSeverity,
} from "@common/types";

type CompilerError = {
  errorCode: string;
  severity: "error" | "warning";
  message: string;
  sourceLocation: {
    start: number;
    end: number;
  };
};

export class DiagnosticConverter {
  private analyzer: Analyzer;

  constructor(analyzer: Analyzer) {
    this.analyzer = analyzer;
  }

  convert(document: TextDocument, error: CompilerError): Diagnostic {
    switch (error.errorCode) {
      case "2018":
        return this.attemptConstrainToFunctionName(document, error);
      case "4937":
        return this.attemptConstrainToFunctionName(document, error);
      default:
        return this.passThroughConversion(document, error);
    }
  }

  private attemptConstrainToFunctionName(
    document: TextDocument,
    error: CompilerError
  ): Diagnostic {
    const range = Range.create(
      document.positionAt(error.sourceLocation.start),
      document.positionAt(error.sourceLocation.end)
    );

    const text = document.getText(range);

    const regex = /(?<=function\s+)[^\s]+(?=\s*\()/gm;

    const match = regex.exec(text);

    if (!match) {
      return this.passThroughConversion(document, error);
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

  private passThroughConversion(document: TextDocument, error: CompilerError) {
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
}

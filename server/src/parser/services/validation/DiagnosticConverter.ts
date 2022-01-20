import { Analyzer } from "@analyzer/index";
import { TextDocument, Diagnostic } from "@common/types";
import { passThroughConversion } from "@compilerDiagnostics/conversions/passThroughConversion";
import { compilerDiagnostics } from "@compilerDiagnostics/compilerDiagnostics";

type HardhatCompilerError = {
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

  convert(document: TextDocument, error: HardhatCompilerError): Diagnostic {
    if (error.errorCode in compilerDiagnostics) {
      return compilerDiagnostics[error.errorCode].fromHardhatCompilerError(
        document,
        error
      );
    } else {
      return passThroughConversion(document, error);
    }
  }
}

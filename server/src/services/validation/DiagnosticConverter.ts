import { TextDocument, Diagnostic } from "@common/types";
import { passThroughConversion } from "@compilerDiagnostics/conversions/passThroughConversion";
import { compilerDiagnostics } from "@compilerDiagnostics/compilerDiagnostics";
import { CompilerDiagnostic } from "@compilerDiagnostics/types";
import { Logger } from "@utils/Logger";
import { HardhatCompilerError } from "../../types";

export class DiagnosticConverter {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public convertErrors(
    document: TextDocument,
    errors: HardhatCompilerError[]
  ): { [uri: string]: Diagnostic[] } {
    const diagnostics: { [uri: string]: Diagnostic[] } = {};

    for (const error of this._filterBlockedErrors(errors)) {
      if (error.sourceLocation === undefined) {
        continue;
      }

      if (!(error.sourceLocation.file in diagnostics)) {
        diagnostics[error.sourceLocation.file] = [];
      }

      const diagnostic = this.convert(document, error);

      diagnostics[error.sourceLocation.file].push(diagnostic);
    }

    return diagnostics;
  }

  public convert(
    document: TextDocument,
    error: HardhatCompilerError
  ): Diagnostic {
    if (error.errorCode in compilerDiagnostics) {
      return compilerDiagnostics[error.errorCode].fromHardhatCompilerError(
        document,
        error
      );
    } else {
      return passThroughConversion(document, error);
    }
  }

  private _filterBlockedErrors(
    errors: HardhatCompilerError[]
  ): HardhatCompilerError[] {
    const locationGroups = this._groupByLocation(errors);

    return Object.values(locationGroups).flatMap(
      this._filterBlockedErrorsWithinGroup
    );
  }

  private _groupByLocation(errors: HardhatCompilerError[]) {
    return errors.reduce(
      (
        acc: { [key: string]: HardhatCompilerError[] },
        error: HardhatCompilerError
      ) => {
        const key = this._resolveErrorFileKey(error);

        if (!(key in acc)) {
          acc[key] = [];
        }

        acc[key].push(error);
        return acc;
      },
      {}
    );
  }

  private _resolveErrorFileKey(error: HardhatCompilerError) {
    if (!error.sourceLocation) {
      this.logger.error(
        new Error(
          `Unattached error found: ${error.message} (${error.errorCode})`
        )
      );

      return "unattached";
    }

    return `${error.sourceLocation.file}::${error.sourceLocation.start}::${error.sourceLocation.end}`;
  }

  private _filterBlockedErrorsWithinGroup(
    errors: HardhatCompilerError[]
  ): HardhatCompilerError[] {
    const blockCodes = errors
      .map((d) => (d.errorCode ? compilerDiagnostics[d.errorCode] : undefined))
      .filter((cd): cd is CompilerDiagnostic => cd !== undefined)
      .flatMap((cd) => cd.blocks);

    return errors.filter(
      (d) => !d.errorCode || !blockCodes.includes(d.errorCode.toString())
    );
  }
}

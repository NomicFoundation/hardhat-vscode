/* eslint-disable @typescript-eslint/no-explicit-any */
import { CompilationDetails } from "../../frameworks/base/CompilationDetails";
import { ValidationResult, ValidationFail, ValidationPass } from "../../types";

export class OutputConverter {
  public static getValidationResults(
    compilationDetails: CompilationDetails,
    solcOutput: any,
    projectBasePath: string
  ): ValidationResult {
    if (solcOutput.errors?.length > 0) {
      const validationFailMessage: ValidationFail = {
        status: "VALIDATION_FAIL",
        projectBasePath,
        version: compilationDetails.solcVersion,
        errors: solcOutput.errors,
      };

      return validationFailMessage;
    } else {
      const validationPassMessage: ValidationPass = {
        status: "VALIDATION_PASS",
        projectBasePath,
        version: compilationDetails.solcVersion,
        sources: Object.keys(compilationDetails.input.sources),
      };

      return validationPassMessage;
    }
  }
}

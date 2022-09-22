/* eslint-disable @typescript-eslint/no-explicit-any */
import CompilationDetails from "../../projects/base/CompilationDetails";
import {
  ValidationCompleteMessage,
  ValidationFail,
  ValidationPass,
} from "../../types";

export default class OutputConverter {
  public static getValidationResults(
    compilationDetails: CompilationDetails,
    solcOutput: any,
    projectBasePath: string
  ): ValidationCompleteMessage {
    if (solcOutput.errors?.length > 0) {
      const validationFailMessage: ValidationFail = {
        type: "VALIDATION_COMPLETE",
        status: "VALIDATION_FAIL",
        jobId: 1,
        projectBasePath,
        version: compilationDetails.solcVersion,
        errors: solcOutput.errors,
      };

      return validationFailMessage;
    } else {
      const validationPassMessage: ValidationPass = {
        type: "VALIDATION_COMPLETE",
        status: "VALIDATION_PASS",
        jobId: 1,
        projectBasePath,
        version: compilationDetails.solcVersion,
        sources: Object.keys(compilationDetails.input.sources),
      };

      return validationPassMessage;
    }
  }
}

import { TextDocument, Diagnostic } from "@common/types";
import { HardhatCompilerError } from "../types";
import { constrainByRegex } from "./constrainByRegex";

export function attemptConstrainToContractName(
  document: TextDocument,
  error: HardhatCompilerError
): Diagnostic {
  return constrainByRegex(
    document,
    error,
    /(?<=contract\s+)[^\s]+(?=\s*(is|{))/gm
  );
}

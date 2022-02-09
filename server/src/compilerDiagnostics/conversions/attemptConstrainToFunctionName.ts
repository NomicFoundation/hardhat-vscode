import { TextDocument, Diagnostic } from "@common/types";
import { HardhatCompilerError } from "../types";
import { constrainByRegex } from "./constrainByRegex";

export function attemptConstrainToFunctionName(
  document: TextDocument,
  error: HardhatCompilerError
): Diagnostic {
  return constrainByRegex(document, error, /(?<=function\s+)[^\s]+(?=\s*\()/gm);
}

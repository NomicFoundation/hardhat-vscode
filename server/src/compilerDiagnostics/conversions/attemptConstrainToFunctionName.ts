import { TextDocument, Diagnostic } from "@common/types";
import { SolcError } from "../../types";
import { constrainByRegex } from "./constrainByRegex";

export function attemptConstrainToFunctionName(
  document: TextDocument,
  error: SolcError
): Diagnostic {
  return constrainByRegex(document, error, /(?<=function\s+)[^\s]+(?=\s*\()/gm);
}

import { TextDocument, Diagnostic } from "@common/types";
import { SolcError } from "../../types";
import { constrainByRegex } from "./constrainByRegex";

export function attemptConstrainToContractName(
  document: TextDocument,
  error: SolcError
): Diagnostic {
  return constrainByRegex(
    document,
    error,
    /(?<=contract\s+)[^\s]+(?=\s*(is|{))/gm
  );
}

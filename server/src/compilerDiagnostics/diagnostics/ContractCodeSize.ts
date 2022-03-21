import { CodeAction, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { CompilerDiagnostic, HardhatCompilerError } from "../types";
import { attemptConstrainToContractName } from "@compilerDiagnostics/conversions/attemptConstrainToContractName";

export class ContractCodeSize implements CompilerDiagnostic {
  public code = "5574";
  public blocks: string[] = [];

  fromHardhatCompilerError(
    document: TextDocument,
    error: HardhatCompilerError
  ): Diagnostic {
    return attemptConstrainToContractName(document, error);
  }

  resolveActions(): CodeAction[] {
    return [];
  }
}

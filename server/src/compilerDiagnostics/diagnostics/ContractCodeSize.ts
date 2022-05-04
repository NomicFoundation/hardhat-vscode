import { CodeAction, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { attemptConstrainToContractName } from "@compilerDiagnostics/conversions/attemptConstrainToContractName";
import { CompilerDiagnostic } from "../types";
import { HardhatCompilerError } from "../../types";

export class ContractCodeSize implements CompilerDiagnostic {
  public code = "5574";
  public blocks: string[] = [];

  public fromHardhatCompilerError(
    document: TextDocument,
    error: HardhatCompilerError
  ): Diagnostic {
    return attemptConstrainToContractName(document, error);
  }

  public resolveActions(): CodeAction[] {
    return [];
  }
}

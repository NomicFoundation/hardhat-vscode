import { CodeAction, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { compilerDiagnostics } from "@compilerDiagnostics/compilerDiagnostics";
import { Analyzer } from "@analyzer/index";
import { Logger } from "@utils/Logger";

export class QuickFixResolver {
  private analyzer: Analyzer;
  private logger: Logger;

  constructor(analyzer: Analyzer, logger: Logger) {
    this.analyzer = analyzer;
    this.logger = logger;
  }

  resolve(
    uri: string,
    document: TextDocument,
    diagnostics: Diagnostic[]
  ): CodeAction[] {
    let actions: CodeAction[] = [];

    for (const diagnostic of diagnostics) {
      try {
        const diagnosticActions = this.resolveActionsFor(diagnostic, {
          document,
          uri,
          analyzer: this.analyzer,
        });

        actions = [...actions, ...diagnosticActions];
      } catch (err) {
        this.logger.error(err);
      }
    }

    return actions;
  }

  private resolveActionsFor(
    diagnostic: Diagnostic,
    {
      document,
      uri,
      analyzer,
    }: { document: TextDocument; uri: string; analyzer: Analyzer }
  ): CodeAction[] {
    if (
      diagnostic &&
      diagnostic.code &&
      diagnostic.code in compilerDiagnostics
    ) {
      return compilerDiagnostics[diagnostic.code].resolveActions(diagnostic, {
        document,
        uri,
        analyzer,
        logger: this.logger,
      });
    } else {
      return [];
    }
  }
}

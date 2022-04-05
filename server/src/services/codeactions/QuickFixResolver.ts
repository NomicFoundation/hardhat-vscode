import { CodeAction, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { compilerDiagnostics } from "@compilerDiagnostics/compilerDiagnostics";
import { LanguageService } from "parser";
import { Analyzer } from "@analyzer/index";
import { Logger } from "@utils/Logger";

export class QuickFixResolver {
  private languageService: LanguageService;
  private logger: Logger;

  constructor(languageService: LanguageService, logger: Logger) {
    this.languageService = languageService;
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
          analyzer: this.languageService.analyzer,
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

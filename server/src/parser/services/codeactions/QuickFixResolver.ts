import { CodeAction, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import * as Sentry from "@sentry/node";
import { Logger } from "@common/types";
import { compilerDiagnostics } from "@compilerDiagnostics/compilerDiagnostics";

export class QuickFixResolver {
  private logger: Logger;

  constructor(logger: Logger) {
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
        });

        actions = [...actions, ...diagnosticActions];
      } catch (err) {
        Sentry.captureException(err);
        this.logger.error(err as string);
      }
    }

    return actions;
  }

  private resolveActionsFor(
    diagnostic: Diagnostic,
    { document, uri }: { document: TextDocument; uri: string }
  ): CodeAction[] {
    if (
      diagnostic &&
      diagnostic.code &&
      diagnostic.code in compilerDiagnostics
    ) {
      return compilerDiagnostics[diagnostic.code].resolveActions(diagnostic, {
        document,
        uri,
      });
    } else {
      return [];
    }
  }
}

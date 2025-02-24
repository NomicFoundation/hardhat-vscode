import * as prettier from "prettier";
import * as prettierPluginSolidity from "prettier-plugin-solidity";
import { ASTNode, TextDocument } from "@common/types";
import { URI } from "vscode-uri";

export class PrettyPrinter2 {
  public async format(
    text: string,
    { document }: { document: TextDocument }
  ): Promise<string> {
    const options = this._mergeOptions(document);

    return prettier.format(text, options);
  }

  public async formatAst(
    ast: ASTNode,
    originalText: string,
    { document }: { document: TextDocument }
  ): Promise<string> {
    const options = this._mergeOptions(document);

    // @ts-expect-error you bet __debug isn't on the type
    const { formatted } = prettier.__debug.formatAST(
      ast,
      {
        ...options,
        originalText,
      },
      2
    );

    return formatted;
  }

  private _mergeOptions(document: TextDocument) {
    const options = {
      parser: "solidity-parse",
      plugins: [prettierPluginSolidity],
    };

    try {
      const config =
        prettier.resolveConfig.sync(URI.parse(document.uri).fsPath, {
          useCache: false,
          editorconfig: true,
        }) ?? this._defaultConfig();

      return {
        ...config,
        ...options,
      };
    } catch (err) {
      return {
        ...this._defaultConfig(),
        ...options,
      };
    }
  }

  private _defaultConfig() {
    return {
      printWidth: 80,
      tabWidth: 4,
      useTabs: false,
      singleQuote: false,
      bracketSpacing: false,
      explicitTypes: "preserve",
      overrides: [
        {
          files: "*.sol",
          options: {
            printWidth: 80,
            tabWidth: 4,
            useTabs: false,
            singleQuote: false,
            bracketSpacing: false,
            explicitTypes: "preserve",
          },
        },
      ],
    };
  }
}

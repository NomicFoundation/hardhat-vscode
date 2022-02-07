import * as prettier from "prettier";
import * as prettierPluginSolidity from "prettier-plugin-solidity";
import { ASTNode, TextDocument } from "@common/types";

export class PrettyPrinter {
  options: prettier.Options;

  constructor() {
    this.options = {
      parser: "solidity-parse",
      plugins: [prettierPluginSolidity],
    };
  }

  format(text: string, { document }: { document: TextDocument }) {
    const options = this.mergeOptions(document);

    return prettier.format(text, options);
  }

  formatAst(
    ast: ASTNode,
    originalText: string,
    { document }: { document: TextDocument }
  ): string {
    const options = this.mergeOptions(document);

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

  private mergeOptions(document: TextDocument) {
    const options = {
      parser: "solidity-parse",
      plugins: [prettierPluginSolidity],
    };

    try {
      const config =
        prettier.resolveConfig.sync(document.uri, {
          useCache: false,
          editorconfig: true,
        }) ?? this.defaultConfig();

      return {
        ...config,
        ...options,
      };
    } catch (err) {
      return {
        ...this.defaultConfig(),
        ...options,
      };
    }
  }

  private defaultConfig() {
    return {
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      singleQuote: false,
      bracketSpacing: false,
      explicitTypes: "always",
      overrides: [
        {
          files: "*.sol",
          options: {
            printWidth: 80,
            tabWidth: 2,
            useTabs: false,
            singleQuote: false,
            bracketSpacing: false,
            explicitTypes: "always",
          },
        },
      ],
    };
  }
}

import * as prettier from "prettier";
import * as prettierPluginSolidity from "prettier-plugin-solidity";
import { ASTNode } from "@common/types";

export class PrettyPrinter {
  options: prettier.Options;

  constructor() {
    this.options = {
      ...this.defaultConfig(),
      parser: "solidity-parse",
      plugins: [prettierPluginSolidity],
    };
  }

  format(text: string) {
    return prettier.format(text, this.options);
  }

  formatAst(ast: ASTNode, originalText: string): string {
    // @ts-expect-error you bet __debug isn't on the type
    const { formatted } = prettier.__debug.formatAST(
      ast,
      {
        ...this.options,
        originalText,
      },
      2
    );

    return formatted;
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

import type { BaseRewriter } from "@nomicfoundation/slang/cst" with {
  "resolution-mode": "import",
};
import { getSlangCst } from "../../../parser/slangHelpers";

/**
 * Build a CST rewriter that strips function/modifier/constructor bodies,
 * variable initializers, and all comments. Used for definitions where we
 * want only the signature/header.
 *
 * Contract/interface/library hovers don't go through this rewriter —
 * they're handled by reading header children via the AST instead.
 *
 * Factory function rather than a top-level class because `BaseRewriter`
 * lives in the ESM-only Slang package and must be loaded via dynamic import.
 */
export async function createSignatureRewriter(): Promise<BaseRewriter> {
  const { BaseRewriter } = await getSlangCst();

  class SignatureRewriter extends BaseRewriter {
    public rewriteFunctionBody() {
      return undefined;
    }
    public rewriteBlock() {
      return undefined;
    }
    public rewriteStateVariableDefinitionValue() {
      return undefined;
    }
    public rewriteVariableDeclarationValue() {
      return undefined;
    }
    public rewriteSingleLineComment() {
      return undefined;
    }
    public rewriteMultiLineComment() {
      return undefined;
    }
    public rewriteSingleLineNatSpecComment() {
      return undefined;
    }
    public rewriteMultiLineNatSpecComment() {
      return undefined;
    }
  }

  return new SignatureRewriter();
}

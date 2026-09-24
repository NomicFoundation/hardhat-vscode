import type { BaseRewriter } from "@nomicfoundation/slang/cst" with {
  "resolution-mode": "import",
};
import { getSlangCst } from "../../../parser/slangHelpers";

/**
 * Build a CST rewriter that strips comments only. Used for signature help
 * to remove any block / line / natspec comments before parsing the
 * signature text — so commas, parens, and braces inside comments don't
 * confuse downstream string parsing.
 *
 * Factory function rather than a top-level class because `BaseRewriter`
 * lives in the ESM-only Slang package and must be loaded via dynamic import.
 */
export async function createCommentStripRewriter(): Promise<BaseRewriter> {
  const { BaseRewriter } = await getSlangCst();

  class CommentStripRewriter extends BaseRewriter {
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

  return new CommentStripRewriter();
}

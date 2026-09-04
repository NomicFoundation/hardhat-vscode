import type { BaseRewriter } from "@nomicfoundation/slang/cst" with {
  "resolution-mode": "import",
};
import { getSlangCst } from "../../../parser/slangHelpers";

/**
 * Build a CST rewriter that strips only comments. Used for type definitions
 * (struct/enum) where we want to keep the body but not show leading natspec.
 *
 * Factory function rather than a top-level class because `BaseRewriter`
 * lives in the ESM-only Slang package and must be loaded via dynamic import.
 */
export async function createBodyKeepRewriter(): Promise<BaseRewriter> {
  const { BaseRewriter } = await getSlangCst();

  class BodyKeepRewriter extends BaseRewriter {
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

  return new BodyKeepRewriter();
}

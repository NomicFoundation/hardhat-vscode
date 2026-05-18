import { HoverParams, Hover, MarkupKind } from "vscode-languageserver/node";
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with { "resolution-mode": "import" };
import type { Node } from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import { ServerState } from "../../types";
import { onCommand } from "../../utils/onCommand";
import {
  resolveIdentifierAtPosition,
  resolveToDefinition,
} from "../../parser/slangHelpers";

// Cached singleton; constructed once the first time we need it because
// BaseRewriter lives in the ESM-only Slang package and must be loaded
// via dynamic import.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let signatureRewriter: any | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let bodyKeepRewriter: any | undefined;

async function getRewriters(): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signature: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bodyKeep: any;
}> {
  if (signatureRewriter !== undefined && bodyKeepRewriter !== undefined) {
    return { signature: signatureRewriter, bodyKeep: bodyKeepRewriter };
  }

  const { BaseRewriter } = await import("@nomicfoundation/slang/cst");

  // Strips function/modifier/constructor bodies, contract/interface/library
  // member blocks, variable initializers, and all comments. Used for
  // definitions where we want only the signature/header.
  class SignatureRewriter extends BaseRewriter {
    rewriteFunctionBody() {
      return undefined;
    }
    rewriteBlock() {
      return undefined;
    }
    rewriteContractMembers() {
      return undefined;
    }
    rewriteInterfaceMembers() {
      return undefined;
    }
    rewriteLibraryMembers() {
      return undefined;
    }
    rewriteStateVariableDefinitionValue() {
      return undefined;
    }
    rewriteVariableDeclarationValue() {
      return undefined;
    }
    rewriteSingleLineComment() {
      return undefined;
    }
    rewriteMultiLineComment() {
      return undefined;
    }
    rewriteSingleLineNatSpecComment() {
      return undefined;
    }
    rewriteMultiLineNatSpecComment() {
      return undefined;
    }
  }

  // Strips only comments. Used for type definitions (struct/enum) where we
  // want to keep the body but not show leading natspec.
  class BodyKeepRewriter extends BaseRewriter {
    rewriteSingleLineComment() {
      return undefined;
    }
    rewriteMultiLineComment() {
      return undefined;
    }
    rewriteSingleLineNatSpecComment() {
      return undefined;
    }
    rewriteMultiLineNatSpecComment() {
      return undefined;
    }
  }

  signatureRewriter = new SignatureRewriter();
  bodyKeepRewriter = new BodyKeepRewriter();

  return { signature: signatureRewriter, bodyKeep: bodyKeepRewriter };
}

export function onHover(serverState: ServerState) {
  return onCommand<HoverParams, Hover | null>(
    serverState,
    findHover,
    null
  );
}

async function findHover(
  unit: CompilationUnit,
  internalUri: string,
  params: HoverParams
): Promise<Hover | null> {
  const { NonterminalKind } = await import("@nomicfoundation/slang/cst");

  const resolution = await resolveIdentifierAtPosition(
    unit,
    internalUri,
    params.position.line,
    params.position.character
  );

  if (resolution === undefined) {
    return null;
  }

  const definition = resolveToDefinition(resolution);

  if (definition === undefined) {
    return null;
  }

  const definiensLocation = definition.definiensLocation;

  if (!definiensLocation.isUserFileLocation()) {
    return null;
  }

  const definiensNode = definiensLocation.cursor.node;

  // Check if this is a type definition (struct, enum) — show full body
  const isTypeDefinition =
    definiensNode.isNonterminalNode() &&
    (definiensNode.kind === NonterminalKind.StructDefinition ||
      definiensNode.kind === NonterminalKind.EnumDefinition);

  // Use a CST rewriter to drop bodies / initializers / comments at the tree
  // level. This is far safer than the old string-based truncation, which
  // could match `{`, `=`, or `(` inside string literals or comments.
  const rewriters = await getRewriters();
  const rewriter = isTypeDefinition ? rewriters.bodyKeep : rewriters.signature;
  const rewritten: Node | undefined = rewriter.rewriteNode(definiensNode);

  let hoverText = (rewritten ?? definiensNode).unparse();

  if (isTypeDefinition) {
    // Keep the body, just clean up
    hoverText = hoverText.replace(/;+\s*$/, "").trim();
  } else {
    // The rewriter has removed every source of `{` that could come from
    // user-controlled text (string initializers, comments, function bodies).
    // Any `{` left in the unparse output is structural — e.g. an empty
    // `contract Foo { }` whose members were stripped. Truncate there.
    const braceIndex = hoverText.indexOf("{");
    if (braceIndex > 0) {
      hoverText = hoverText.substring(0, braceIndex);
    }

    hoverText = hoverText.replace(/;+\s*$/, "");
    // Collapse residual multi-line whitespace from where bodies/initializers used to be
    hoverText = hoverText.replace(/\s+/g, " ").trim();
    // Normalize spaces around parentheses: `( x, y )` → `(x, y)`
    hoverText = hoverText.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
  }

  if (hoverText.length === 0) {
    return null;
  }

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: ["```solidity", hoverText, "```"].join("\n"),
    },
  };
}

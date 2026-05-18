import { HoverParams, Hover, MarkupKind } from "vscode-languageserver/node";
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with { "resolution-mode": "import" };
import type {
  Node,
  NonterminalKind as NonterminalKindType,
  NonterminalNode,
} from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
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

  // Strips function/modifier/constructor bodies, variable initializers, and
  // all comments. Used for definitions where we want only the signature.
  // Contract/interface/library hovers don't go through this rewriter —
  // they're handled by reading header children via the AST instead.
  class SignatureRewriter extends BaseRewriter {
    rewriteFunctionBody() {
      return undefined;
    }
    rewriteBlock() {
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

  // Contract/interface/library hovers: read the header children via the AST.
  // This avoids any need to walk braces or strip member blocks.
  const headerText = await tryBuildContractLikeHeader(definiensNode, NonterminalKind);
  let hoverText: string;

  if (headerText !== undefined) {
    hoverText = headerText;
  } else {
    // Type definitions (struct, enum) — show full body, just strip leading comments.
    // Everything else (function/modifier/constructor/state var/local var) — strip body
    // and initializer via the signature rewriter.
    const isTypeDefinition =
      definiensNode.isNonterminalNode() &&
      (definiensNode.kind === NonterminalKind.StructDefinition ||
        definiensNode.kind === NonterminalKind.EnumDefinition);

    const rewriters = await getRewriters();
    const rewriter = isTypeDefinition ? rewriters.bodyKeep : rewriters.signature;
    const rewritten: Node | undefined = rewriter.rewriteNode(definiensNode);

    hoverText = (rewritten ?? definiensNode).unparse();

    if (isTypeDefinition) {
      hoverText = hoverText.replace(/;+\s*$/, "").trim();
    } else {
      hoverText = hoverText.replace(/;+\s*$/, "");
      // Collapse residual multi-line whitespace from where bodies/initializers used to be
      hoverText = hoverText.replace(/\s+/g, " ").trim();
      // Normalize spaces around parentheses: `( x, y )` → `(x, y)`
      hoverText = hoverText.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
    }
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

/**
 * For a ContractDefinition/InterfaceDefinition/LibraryDefinition definiens,
 * build the header text directly from the AST: keyword(s), name, and
 * inheritance/specifiers. Returns undefined for any other node kind, so the
 * caller can fall back to the rewriter-based path.
 */
async function tryBuildContractLikeHeader(
  definiensNode: Node,
  NonterminalKind: typeof NonterminalKindType
): Promise<string | undefined> {
  if (!definiensNode.isNonterminalNode()) {
    return undefined;
  }

  const node: NonterminalNode = definiensNode;
  const kind = node.kind;

  if (
    kind !== NonterminalKind.ContractDefinition &&
    kind !== NonterminalKind.InterfaceDefinition &&
    kind !== NonterminalKind.LibraryDefinition
  ) {
    return undefined;
  }

  const ast = await import("@nomicfoundation/slang/ast");

  if (kind === NonterminalKind.ContractDefinition) {
    const c = new ast.ContractDefinition(node);
    const parts: string[] = [];
    if (c.abstractKeyword !== undefined) {
      parts.push(c.abstractKeyword.unparse().trim());
    }
    parts.push(c.contractKeyword.unparse().trim());
    parts.push(c.name.unparse().trim());
    const specifiers = c.specifiers.cst.unparse().trim();
    if (specifiers.length > 0) {
      parts.push(specifiers);
    }
    return parts.join(" ");
  }

  if (kind === NonterminalKind.InterfaceDefinition) {
    const i = new ast.InterfaceDefinition(node);
    const parts: string[] = [
      i.interfaceKeyword.unparse().trim(),
      i.name.unparse().trim(),
    ];
    if (i.inheritance !== undefined) {
      const inh = i.inheritance.cst.unparse().trim();
      if (inh.length > 0) {
        parts.push(inh);
      }
    }
    return parts.join(" ");
  }

  // LibraryDefinition
  const l = new ast.LibraryDefinition(node);
  return `${l.libraryKeyword.unparse().trim()} ${l.name.unparse().trim()}`;
}

import { HoverParams, Hover, MarkupKind } from "vscode-languageserver/node";
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with {
  "resolution-mode": "import",
};
import type {
  BaseRewriter,
  Node,
  NonterminalKind as NonterminalKindType,
  NonterminalNode,
} from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import { ServerState } from "../../types";
import { onCommand } from "../../utils/onCommand";
import {
  getSlangAst,
  getSlangCst,
  resolveIdentifierAtPosition,
  resolveToDefinition,
} from "../../parser/slangHelpers";

import { createSignatureRewriter } from "./rewriters/SignatureRewriter";
import { createBodyKeepRewriter } from "./rewriters/BodyKeepRewriter";

// Cached singletons; constructed on first use.
let signatureRewriter: BaseRewriter | undefined;
let bodyKeepRewriter: BaseRewriter | undefined;

async function getRewriters(): Promise<{
  signature: BaseRewriter;
  bodyKeep: BaseRewriter;
}> {
  if (signatureRewriter === undefined) {
    signatureRewriter = await createSignatureRewriter();
  }
  if (bodyKeepRewriter === undefined) {
    bodyKeepRewriter = await createBodyKeepRewriter();
  }
  return { signature: signatureRewriter, bodyKeep: bodyKeepRewriter };
}

export function onHover(serverState: ServerState) {
  return onCommand<HoverParams, Hover | null>(serverState, findHover, null);
}

async function findHover(
  unit: CompilationUnit,
  internalUri: string,
  params: HoverParams
): Promise<Hover | null> {
  const { NonterminalKind } = await getSlangCst();

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
  const headerText = await tryBuildContractLikeHeader(
    definiensNode,
    NonterminalKind
  );
  let hoverText: string;

  if (headerText !== undefined) {
    hoverText = headerText;
  } else {
    // Type definitions (struct, enum) — show full body, just strip leading comments.
    // Everything else (function/modifier/constructor/state var/local var) — strip body
    // and initializer via the signature rewriter.
    const isEnum =
      definiensNode.isNonterminalNode() &&
      definiensNode.kind === NonterminalKind.EnumDefinition;
    const isStruct =
      definiensNode.isNonterminalNode() &&
      definiensNode.kind === NonterminalKind.StructDefinition;
    const isTypeDefinition = isEnum || isStruct;

    const rewriters = await getRewriters();
    const rewriter = isTypeDefinition
      ? rewriters.bodyKeep
      : rewriters.signature;
    const rewritten: Node | undefined = rewriter.rewriteNode(definiensNode);

    hoverText = (rewritten ?? definiensNode).unparse();

    if (isEnum) {
      // An enum is short enough to read on one line, and a hover is not the
      // place to reproduce how the source happened to wrap it.
      hoverText = hoverText
        .replace(/;+\s*$/, "")
        .replace(/\s+/g, " ")
        .trim();
    } else if (isStruct) {
      // Keep the body over several lines, but not the indentation it inherited
      // from wherever the struct sits in the file — a nested declaration would
      // otherwise arrive in the popup pushed several levels to the right.
      hoverText = dedent(hoverText.replace(/;+\s*$/, "").trim());
    } else {
      // These regexes operate on text that the rewriter has already stripped
      // of comments and bodies/initializers — so any whitespace and
      // parentheses we see here are structural (signature shape), never
      // inside user-controlled strings or comments.
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
 * Removes the indentation a multi-line declaration inherited from its position
 * in the file, by stripping the smallest indent any of its later lines has.
 * The first line is already flush, since unparsing starts at the declaration.
 */
function dedent(text: string): string {
  const [first, ...rest] = text.split("\n");

  const indents = rest
    .filter((line) => line.trim() !== "")
    .map((line) => (line.match(/^[ \t]*/) ?? [""])[0].length);

  if (indents.length === 0) {
    return text;
  }

  const common = Math.min(...indents);

  return [first, ...rest.map((line) => line.slice(common))].join("\n");
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

  const ast = await getSlangAst();

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

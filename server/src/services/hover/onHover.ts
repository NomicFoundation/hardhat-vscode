import { HoverParams, Hover, MarkupKind } from "vscode-languageserver/node";
import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with { "resolution-mode": "import" };
import { ServerState } from "../../types";
import { onCommand } from "../../utils/onCommand";
import {
  resolveIdentifierAtPosition,
  resolveToDefinition,
} from "../../parser/slangHelpers";

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

  // Get the CST text of the definition
  const definiensText = definiensLocation.cursor.node.unparse();
  const definiensNode = definiensLocation.cursor.node;

  // Check if this is a type definition (struct, enum) — show full body
  const isTypeDefinition =
    definiensNode.isNonterminalNode() &&
    (definiensNode.kind === NonterminalKind.StructDefinition ||
      definiensNode.kind === NonterminalKind.EnumDefinition);

  // Clean up the definiens text for display
  let hoverText = definiensText;

  // Truncate at first '{' to show just the signature for block constructs
  // But keep full body for type definitions (structs, enums)
  if (!isTypeDefinition) {
    const braceIndex = hoverText.indexOf("{");
    if (braceIndex > 0) {
      hoverText = hoverText.substring(0, braceIndex);
    }
  }

  // Strip variable initializers: find top-level '=' not inside parentheses
  // (avoids truncating 'mapping(address => uint)' at the '=>')
  let parenDepth = 0;
  for (let i = 0; i < hoverText.length; i++) {
    if (hoverText[i] === "(") parenDepth++;
    else if (hoverText[i] === ")") parenDepth--;
    else if (hoverText[i] === "=" && parenDepth === 0) {
      hoverText = hoverText.substring(0, i);
      break;
    }
  }

  // Remove trailing semicolons
  hoverText = hoverText.replace(/;+\s*$/, "");

  // For non-type definitions, collapse multi-line whitespace into single spaces
  if (!isTypeDefinition) {
    hoverText = hoverText.replace(/\s+/g, " ").trim();
    // Normalize spaces around parentheses: '( x, y )' → '(x, y)'
    hoverText = hoverText.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
  } else {
    hoverText = hoverText.trim();
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

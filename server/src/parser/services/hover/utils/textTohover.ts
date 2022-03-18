import { MarkupKind } from "vscode-languageserver/node";

export function textToHover(hoverText: string | null) {
  if (hoverText === null) {
    return null;
  }

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: ["```solidity", hoverText, "```"].join("\n"),
    },
  };
}

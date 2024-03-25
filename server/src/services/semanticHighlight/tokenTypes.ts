import { SemanticTokenTypes } from "vscode-languageserver-types";

// Semantic token types that we support
export const tokensTypes = [
  SemanticTokenTypes.keyword,
  SemanticTokenTypes.number,
  SemanticTokenTypes.type,
  SemanticTokenTypes.string,
  SemanticTokenTypes.function,
];

const tokenTypesMap = tokensTypes.reduce(
  (map: Record<string, number>, tokenType, index) => {
    map[tokenType] = index;
    return map;
  },
  {}
);

// Helper function to get the index of our supported token types list
export function getTokenTypeIndex(token: string) {
  const tokenType = tokenTypesMap[token];

  if (tokenType === undefined) {
    throw new Error(`Invalid token type requested: ${token}`);
  }

  return tokenType;
}

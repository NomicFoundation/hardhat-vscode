/**
 * Token type compatible with @solidity-parser/parser's Token format.
 * Defined locally to avoid depending on the jsparser package.
 */
export interface Token {
  type: string;
  value: string;
  range?: [number, number];
}

import _ from "lodash";

export interface Remapping {
  from: string;
  to: string;
}

export function parseRemappings(rawRemappings: string) {
  const lines = rawRemappings.trim().split("\n");

  return _.compact(lines.map(parseRemappingLine));
}

export function parseRemappingLine(line: string): Remapping | undefined {
  const lineTokens = line.split("=", 2);

  if (
    lineTokens.length !== 2 ||
    lineTokens[0].length === 0 ||
    lineTokens[1].length === 0
  ) {
    return undefined;
  }

  const [from, to] = lineTokens.map((token) =>
    token.endsWith("/") ? token : `${token}/`
  );

  return {
    from,
    to,
  };
}

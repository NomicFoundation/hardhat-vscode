import _ from "lodash";
import { Range, Position } from "vscode-languageserver-types";
import semver from "semver";
import type {
  TextIndex,
  TextRange,
} from "@nomicfoundation/slang/cst" with { "resolution-mode": "import" };
import { Logger } from "../utils/Logger";

export function slangToVSCodeRange(range: TextRange): Range {
  return {
    start: slangToVSCodePosition(range.start),
    end: slangToVSCodePosition(range.end),
  };
}

export function slangToVSCodePosition(position: TextIndex): Position {
  return {
    line: position.line,
    character: position.column,
  };
}

export async function resolveVersion(
  logger: Logger,
  versionPragmas: string[]
): Promise<string> {
  const { LanguageFacts } = await import("@nomicfoundation/slang/utils");
  const versions = LanguageFacts.allVersions();

  const slangVersion = semver.maxSatisfying(versions, versionPragmas.join(" "));

  if (slangVersion !== null) {
    return slangVersion;
  } else {
    const latest = versions[versions.length - 1];

    logger.info(
      `No Slang-supported version (latest: ${latest}) for Solidity found that satisfies the pragma directives: '${versionPragmas.join(
        " "
      )}'.`
    );

    return latest;
  }
}

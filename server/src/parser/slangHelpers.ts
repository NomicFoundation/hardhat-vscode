import { TextIndex, TextRange } from "@nomicfoundation/slang/text_index";
import _ from "lodash";
import { Range, Position } from "vscode-languageserver-types";
import { Language } from "@nomicfoundation/slang/language";
import semver from "semver";
import { Logger } from "../utils/Logger";
import { getPlatform } from "../utils/operatingSystem";

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

const SUPPORTED_PLATFORMS = [
  "darwin-arm64",
  "darwin-x64",
  "linux-arm64",
  "linux-x64",
  "win32-arm64",
  "win32-ia32",
  "win32-x64",
];

export function isSlangSupported() {
  const currentPlatform = getPlatform();

  return SUPPORTED_PLATFORMS.includes(currentPlatform);
}

export function resolveVersion(
  logger: Logger,
  versionPragmas: string[]
): string {
  const versions = Language.supportedVersions();

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

import { RuleNode, TokenNode } from "@nomicfoundation/slang/cst";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { TextRange } from "@nomicfoundation/slang/text_index";
import _ from "lodash";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Range } from "vscode-languageserver-types";
import { Language } from "@nomicfoundation/slang/language";
import semver from "semver";
import { Logger } from "../utils/Logger";
import { getPlatform } from "../utils/operatingSystem";

export type SlangNode = RuleNode | TokenNode;
export type NodeKind = RuleKind | TokenKind;

export function slangToVSCodeRange(
  doc: TextDocument,
  slangRange: TextRange
): Range {
  return {
    start: doc.positionAt(slangRange.start.utf16),
    end: doc.positionAt(slangRange.end.utf16),
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

    logger.error(
      new Error(
        `No Slang-supported version (latest: ${latest}) for Solidity found that satisfies the pragma directives: '${versionPragmas.join(
          " "
        )}'.`
      )
    );

    return latest;
  }
}

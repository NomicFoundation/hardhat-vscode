import * as fs from "fs";
import path from "node:path";
import { Remapping } from "@common/types";
import { toUnixStyle } from "../../../utils";

function applyPathRemapping(originalPath: string, pathRemappings: Remapping[]) {
  if (!pathRemappings.length || originalPath.startsWith(".")) {
    return originalPath;
  }

  for (const { from, to } of pathRemappings) {
    if (originalPath.startsWith(from)) {
      return path.join(to, originalPath.slice(from.length));
    }
  }

  return originalPath;
}

export function resolveDependency(
  cwd: string,
  originalPath: string,
  pathRemappings: Remapping[] = []
): string {
  const remappedPath = applyPathRemapping(originalPath, pathRemappings);
  const resolvedPath = require.resolve(remappedPath, {
    paths: [fs.realpathSync(cwd)],
  });

  return toUnixStyle(fs.realpathSync(resolvedPath));
}

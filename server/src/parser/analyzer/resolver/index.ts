import * as fs from "fs";
import * as path from "path";
import { Remapping } from "@common/types";
import { toUnixStyle } from "../../../utils";

export function resolveDependency(
  cwd: string,
  originalPath: string,
  pathRemappings: Remapping[] = []
): string {
  if (pathRemappings.length && !originalPath.startsWith(".")) {
    for (const { from, to } of pathRemappings) {
      if (originalPath.startsWith(from)) {
        const remappedPath = path.join(to, originalPath.slice(from.length));
        return toUnixStyle(fs.realpathSync(remappedPath));
      }
    }
  }

  const resolvedPath = require.resolve(originalPath, {
    paths: [fs.realpathSync(cwd)],
  });

  return toUnixStyle(fs.realpathSync(resolvedPath));
}

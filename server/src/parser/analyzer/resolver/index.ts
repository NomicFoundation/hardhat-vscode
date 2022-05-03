import * as fs from "fs";
import { ImportDirective } from "@common/types";
import { toUnixStyle } from "../../../utils";

export function resolveDependency(
  cwd: string,
  importDirective: ImportDirective
): string {
  const resolvedPath = require.resolve(importDirective.path, {
    paths: [fs.realpathSync(cwd)],
  });

  return toUnixStyle(fs.realpathSync(resolvedPath));
}

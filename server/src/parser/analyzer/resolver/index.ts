import * as path from "path";
import * as os from "os";

import { ImportDirective } from "@common/types";
import { toUnixStyle } from "../../../utils";

export const BROWNIE_PACKAGE_PATH = path.resolve(
  os.homedir(),
  ".brownie",
  "packages"
);

export function resolveDependency(
  cwd: string,
  stopAt: string,
  importDirective: ImportDirective
): string {
  const paths = [cwd];

  return toUnixStyle(require.resolve(importDirective.path, { paths }));
}

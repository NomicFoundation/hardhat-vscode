/* eslint-disable no-constant-condition */
import * as path from "path";
import { WorkspaceFileRetriever } from "./WorkspaceFileRetriever";

export async function findClosestPackageJson(
  fileRetriever: WorkspaceFileRetriever,
  dir: string
): Promise<string | undefined> {
  let currentDir = path.resolve(dir);

  while (true) {
    const packageJsonPath = path.join(currentDir, "package.json");

    if (await fileRetriever.fileExists(packageJsonPath)) {
      return packageJsonPath;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

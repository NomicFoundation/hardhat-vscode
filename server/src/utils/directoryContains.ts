import path from "path";

/**
 * Returns true if testPath is equal to dirPath or a subdirectory of it
 * @param dirPath
 * @param testPath
 * @returns
 */
export function directoryContains(dirPath: string, testPath: string): boolean {
  const relative = path.relative(dirPath, testPath);

  return !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

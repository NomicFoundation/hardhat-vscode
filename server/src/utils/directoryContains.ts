import path from "path";

export function directoryContains(dirPath: string, testPath: string): boolean {
  const relative = path.relative(dirPath, testPath);
  return (
    !!relative &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

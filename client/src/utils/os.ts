import { execFile } from "child_process";
import os from "os";

export async function runCmd(
  cmd: string,
  args: string[],
  cwd?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd }, function (error, stdout) {
      if (error !== null) {
        reject(error);
      }

      resolve(stdout);
    });
  });
}

export function runningOnWindows() {
  return os.platform() === "win32";
}

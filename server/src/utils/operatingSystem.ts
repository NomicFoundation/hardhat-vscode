import { exec } from "child_process";
import os from "os";

export function runningOnWindows() {
  return os.platform() === "win32";
}

export async function runCmd(cmd: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, function (error, stdout) {
      if (error !== null) {
        reject(error);
      }

      resolve(stdout);
    });
  });
}

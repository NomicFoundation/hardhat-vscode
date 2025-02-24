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

/**
 * Executes a command using exec, writes provided input to stdin,
 * and returns a Promise that resolves with stdout and stderr.
 *
 * @param {string} command - The command to execute.
 * @param {string} input - The input string to write to the child process's stdin.
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export async function execWithInput(
  command: string,
  input: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    // Start the child process
    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve({ stdout, stderr });
    });

    // Check that we have a writable stdin stream
    if (child.stdin && child.stdin.writable) {
      // Handle errors on the stdin stream
      child.stdin.on("error", (err) => {
        reject(`Error on child.stdin: ${err}`);
      });

      // Write the input, then close the stream.
      child.stdin.write(input, (writeErr) => {
        if (writeErr) {
          reject(`Error writing to stdin: ${writeErr}}`);
          // Even on error, end the stream to avoid hanging.
          child.stdin?.end();
        } else {
          child.stdin?.end();
        }
      });
    } else {
      reject("Child process has no writable stdin stream");
    }
  });
}

export function getPlatform() {
  return `${os.platform()}-${os.arch()}`;
}

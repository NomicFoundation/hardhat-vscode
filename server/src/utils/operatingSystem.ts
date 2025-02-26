import { exec, ExecOptions } from "child_process";
import os from "os";
import { TimeoutError } from "./errors";

export function runningOnWindows() {
  return os.platform() === "win32";
}

export async function runCmd(cmd: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, function (error, stdout) {
      if (error !== null) {
        reject(error);
        return;
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
 * @param {ExecOptions} options - The options to pass to the exec function.
 * @param {number} timeout - The timeout in milliseconds.
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export async function execWithInput(
  command: string,
  input: string,
  options: ExecOptions,
  timeout?: number
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    // Set a timeout if provided
    let timer: NodeJS.Timeout | undefined;
    if (timeout !== undefined) {
      timer = setTimeout(() => {
        reject(new TimeoutError(timeout));
      }, timeout);
    }

    // Start the child process
    const child = exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve({ stdout, stderr });
    });

    // Clear timeout on process exit
    child.on("exit", () => {
      if (timer) {
        clearTimeout(timer);
      }
    });

    // Check that we have a writable stdin stream
    if (child.stdin && child.stdin.writable && child.killed === false) {
      // Handle errors on the stdin stream
      child.stdin.on("error", (err) => {
        reject(new Error(`Error on child.stdin: ${err}`));
      });

      // Write the input, then close the stream.
      child.stdin.write(input, (writeErr) => {
        if (writeErr) {
          reject(new Error(`Error writing to stdin: ${writeErr}}`));
          // Even on error, end the stream to avoid hanging.
          child.stdin?.end();
        } else {
          child.stdin?.end();
        }
      });
    } else {
      reject(new Error("Child process has no writable stdin stream"));
    }
  });
}

export function getPlatform() {
  return `${os.platform()}-${os.arch()}`;
}

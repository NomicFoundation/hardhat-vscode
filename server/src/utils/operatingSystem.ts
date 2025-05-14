import { exec, ExecOptions } from "child_process";
import os from "os";
import { uppercaseDriveLetter } from "./paths";

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
  options: ExecOptions = {}
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = exec(command, options, (error, stdout, stderr) => {
      // `error` is any execution error. e.g. command not found, non-zero exit code, etc.
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });

    // This could be triggered if node fails to spawn the child process
    child.on("error", (err) => {
      reject(err);
    });

    const stdin = child.stdin;

    if (stdin) {
      stdin.on("error", (err) => {
        // This captures EPIPE error
        reject(err);
      });

      child.once("spawn", () => {
        if (!stdin.writable || child.killed) {
          return reject(new Error("Failed to write to unwritable stdin"));
        }

        stdin.write(input, (error) => {
          if (error) {
            reject(error);
          }
          stdin.end();
        });
      });
    } else {
      reject(new Error("No stdin on child process"));
    }
  });
}

export function getPlatform() {
  return `${os.platform()}-${os.arch()}`;
}

// Returns a normalized version of cwd. Useful on windows
export function normalizedCwd() {
  return uppercaseDriveLetter(process.cwd());
}

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { runCmd, runningOnWindows } from "../../utils/operatingSystem";

let resolvedForgeCommand: string;

export async function resolveForgeCommand() {
  if (resolvedForgeCommand) {
    return resolvedForgeCommand;
  }

  const potentialForgeCommands = ["forge"];

  if (runningOnWindows()) {
    potentialForgeCommands.push(
      `${process.env.USERPROFILE}\\.cargo\\bin\\forge`
    );
  } else {
    potentialForgeCommands.push(
      `${process.env.XDG_CONFIG_HOME || process.env.HOME}/.foundry/bin/forge`
    );
  }

  for (const potentialForgeCommand of potentialForgeCommands) {
    try {
      await runCmd(`${potentialForgeCommand} --version`);
      resolvedForgeCommand = potentialForgeCommand;

      return potentialForgeCommand;
    } catch (error: any) {
      if (
        error.code === 127 || // unix
        error.code === "ENOENT" || // unix
        error.toString().includes("is not recognized") || // windows (code: 1)
        error.toString().includes("cannot find the path") // windows (code: 1)
      ) {
        // command not found, then try the next potential command
        continue;
      } else {
        // command found but execution failed
        throw error;
      }
    }
  }

  throw new Error(
    `Couldn't find forge binary. Performed lookup: ${JSON.stringify(
      potentialForgeCommands
    )}`
  );
}

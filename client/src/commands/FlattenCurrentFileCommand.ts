import { spawn } from "child_process";
import {
  ensureCurrentHardhatDir,
  getCurrentOpenFile,
} from "../utils/workspace";
import {
  ensureHardhatIsInstalled,
  openNewDocument,
  withProgressNotification,
} from "../utils/window";
import Command from "./Command";

export default class FlattenCurrentFileCommand extends Command {
  public async execute(): Promise<void> {
    const currentHardhatDir = await ensureCurrentHardhatDir();
    const currentFile = getCurrentOpenFile();

    if (currentFile === undefined || currentHardhatDir === undefined) {
      return;
    }

    if (!(await ensureHardhatIsInstalled(currentHardhatDir))) {
      return;
    }

    await withProgressNotification("Flattening", async () => {
      const flattened = await new Promise((resolve, reject) => {
        const buffer: string[] = [];
        const childProcess = spawn(
          "npx",
          ["hardhat", "flatten", currentFile.uri.path],
          {
            cwd: currentHardhatDir,
          }
        );

        childProcess.stdout.on("data", (data) => {
          buffer.push(data.toString());
        });
        childProcess.stderr.on("data", (data) => {
          this.outputChannel.show();
          this.outputChannel.append(data.toString());
          reject();
        });
        childProcess.stdout.on("close", () => {
          resolve(buffer.join(""));
        });
      });

      if (typeof flattened !== "string") return;

      await openNewDocument(flattened);
    });
  }

  public name(): string {
    return "flattenCurrentFile";
  }
}

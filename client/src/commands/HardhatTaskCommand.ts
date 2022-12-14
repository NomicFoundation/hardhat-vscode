/* eslint-disable @typescript-eslint/no-empty-function */
import { spawn } from "child_process";
import vscode from "vscode";
import { getHardhatCLIPath } from "../utils/hardhat";
import {
  ensureHardhatIsInstalled,
  withProgressNotification,
} from "../utils/window";
import { ensureCurrentHardhatDir } from "../utils/workspace";
import Command from "./Command";

export default abstract class HardhatTaskCommand extends Command {
  public async execute() {
    const currentHardhatDir = await ensureCurrentHardhatDir(this.state);

    if (currentHardhatDir === undefined) {
      return;
    }

    if (!(await ensureHardhatIsInstalled(currentHardhatDir))) {
      return;
    }

    if (!(await this.beforeExecute())) return;

    const cliPath = getHardhatCLIPath(currentHardhatDir);

    this.state.outputChannel.appendLine(
      `Running 'hardhat ${this.hardhatArgs().join(" ")}'\n`
    );

    const exitStatus = await withProgressNotification(
      this.progressLabel(),
      async () => {
        return new Promise((resolve) => {
          const childProcess = spawn("node", [cliPath, ...this.hardhatArgs()], {
            cwd: currentHardhatDir,
          });

          childProcess.stdout.on("data", (data) => {
            this.onStdout(data.toString());
          });

          childProcess.stderr.on("data", (data) => {
            this.onStderr(data.toString());
          });

          childProcess.on("close", async (_status: number) => {
            this.onClose(_status);
            resolve(_status);
          });
        });
      }
    );

    if (exitStatus !== 0) {
      this.state.outputChannel.show();
      await vscode.window.showErrorMessage(
        "Solidity command errored, please see output logs."
      );
    }
  }

  public async beforeExecute() {
    return true;
  }

  public abstract hardhatArgs(): string[];

  public abstract progressLabel(): string;

  public onStdout(data: string): void {
    this.state.outputChannel.append(data);
  }

  public onStderr(data: string): void {
    this.state.outputChannel.append(data);
  }

  public onClose(_status: number): void {}
}

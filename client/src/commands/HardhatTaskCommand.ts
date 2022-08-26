import { spawn } from "child_process";
import { ensureHardhatIsInstalled } from "../utils/window";
import { ensureCurrentHardhatDir } from "../utils/workspace";
import Command from "./Command";

export default abstract class HardhatTaskCommand extends Command {
  public async execute() {
    const currentHardhatDir = await ensureCurrentHardhatDir();

    if (currentHardhatDir === undefined) {
      return;
    }

    if (!(await ensureHardhatIsInstalled(currentHardhatDir))) {
      return;
    }

    this.outputChannel.show();
    this.outputChannel.appendLine(`Running 'npx hardhat ${this.taskName()}'\n`);
    const childProcess = spawn("npx", ["hardhat", this.taskName()], {
      cwd: currentHardhatDir,
    });

    childProcess.stdout.on("data", (data) => {
      this.outputChannel.append(data.toString());
    });
    childProcess.stderr.on("data", (data) => {
      this.outputChannel.append(data.toString());
    });
    childProcess.stdout.on("close", () => {
      this.outputChannel.appendLine("\nProcess exited\n");
    });
  }

  /**
   * Task name that will be passed to `npx hardhat (...)`
   */
  public abstract taskName(): string;
}

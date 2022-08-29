import HardhatTaskCommand from "./HardhatTaskCommand";

export default class CleanCommand extends HardhatTaskCommand {
  public name(): string {
    return "clean";
  }

  public hardhatArgs(): string[] {
    return [this.name()];
  }

  public progressLabel(): string {
    return "Cleaning artifacts and cache";
  }
}

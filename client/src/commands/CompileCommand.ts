import HardhatTaskCommand from "./HardhatTaskCommand";

export default class CompileCommand extends HardhatTaskCommand {
  public name(): string {
    return "compile";
  }

  public hardhatArgs(): string[] {
    return [this.name()];
  }

  public progressLabel(): string {
    return "Compiling the project";
  }
}

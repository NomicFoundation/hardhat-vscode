import HardhatTaskCommand from "./HardhatTaskCommand";

export default class CompileCommand extends HardhatTaskCommand {
  public name(): string {
    return "compile";
  }

  public taskName(): string {
    return this.name();
  }
}

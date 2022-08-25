import HardhatTaskCommand from "./HardhatTaskCommand";

export default class CleanCommand extends HardhatTaskCommand {
  public name(): string {
    return "clean";
  }

  public taskName(): string {
    return this.name();
  }
}

import HardhatTaskCommand from "./HardhatTaskCommand";

export default class FlattenCommand extends HardhatTaskCommand {
  public name(): string {
    return "flatten";
  }

  public taskName(): string {
    return this.name();
  }
}

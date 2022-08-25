import HardhatTaskCommand from "./HardhatTaskCommand";

export default class TestCommand extends HardhatTaskCommand {
  public name(): string {
    return "test";
  }

  public taskName(): string {
    return this.name();
  }
}

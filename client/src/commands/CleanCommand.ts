import HardhatTaskCommand from "./HardhatTaskCommand";

export default class CleanCommand extends HardhatTaskCommand {
  public name(): string {
    return "solidity.hardhat.clean";
  }

  public hardhatArgs(): string[] {
    return ["clean"];
  }

  public progressLabel(): string {
    return "Cleaning artifacts and cache";
  }
}

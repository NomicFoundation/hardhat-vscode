import HardhatTaskCommand from "./HardhatTaskCommand";

export default class CompileCommand extends HardhatTaskCommand {
  public name(): string {
    return "solidity.hardhat.compile";
  }

  public hardhatArgs(): string[] {
    return ["compile"];
  }

  public progressLabel(): string {
    return "Compiling the project";
  }
}

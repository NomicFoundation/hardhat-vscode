import { OutputChannel } from "vscode";

export default abstract class Command {
  constructor(public outputChannel: OutputChannel) {}

  public abstract execute(): Promise<void>;

  public abstract name(): string;
}

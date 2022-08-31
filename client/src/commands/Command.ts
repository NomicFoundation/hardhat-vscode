import { OutputChannel } from "vscode";

export default abstract class Command {
  constructor(public outputChannel: OutputChannel) {}

  public abstract execute(commandArgs: unknown): Promise<unknown>;

  public abstract name(): string;
}

import { ExtensionState } from "../types";

export default abstract class Command {
  constructor(public state: ExtensionState) {}

  public abstract execute(commandArgs: unknown): Promise<unknown>;

  public abstract name(): string;
}

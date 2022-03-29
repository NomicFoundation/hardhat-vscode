import { ExtensionState } from "../types";

export interface Telemetry {
  init(extensionState: ExtensionState): void;
  captureException(err: unknown): void;
  close(): Promise<boolean>;
}

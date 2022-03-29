import { ExtensionContext, OutputChannel } from "vscode";
import { Disposable, LanguageClient } from "vscode-languageclient/node";
import { Telemetry } from "./telemetry/types";
import { Logger } from "./utils/Logger";

export type Environment = "development" | "production";

export type ExtensionState = {
  context: ExtensionContext;

  name: string;
  version: string;
  env: Environment;
  machineId: string;
  serverModulePath: string;

  clients: Map<string, LanguageClient>;
  listenerDisposables: Disposable[];

  globalTelemetryEnabled: boolean;
  hardhatTelemetryEnabled: boolean;

  telemetry: Telemetry;
  outputChannel: OutputChannel;
  logger: Logger;
};

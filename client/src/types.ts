import { ExtensionContext, LanguageStatusItem, OutputChannel } from "vscode";
import { Disposable, LanguageClient } from "vscode-languageclient/node";
import { Telemetry } from "./telemetry/types";
import { Logger } from "./utils/Logger";

export type Environment = "development" | "production";

export interface ExtensionState {
  context: ExtensionContext;

  name: string;
  version: string;
  env: Environment;
  machineId: string;
  serverModulePath: string;

  client: LanguageClient | null;
  currentIndexingJobs: LanguageStatusItem[];
  projectsValidationStatus: { [key: string]: LanguageStatusItem };
  listenerDisposables: Disposable[];

  globalTelemetryEnabled: boolean;
  hardhatTelemetryEnabled: boolean;

  telemetry: Telemetry;
  outputChannel: OutputChannel;
  commandsOutputChannel: OutputChannel;
  logger: Logger;

  hardhatConfigStatusItem: LanguageStatusItem | null;
}

import * as path from "path";
import {
  window,
  workspace,
  env,
  ExtensionContext,
  OutputChannel,
} from "vscode";
import { SentryClientTelemetry } from "../telemetry/SentryClientTelemetry";

import { ExtensionState } from "../types";
import { Logger } from "../utils/Logger";

export function setupExtensionState(
  context: ExtensionContext,
  { sentryDsn }: { sentryDsn: string }
): ExtensionState {
  const serverModulePath = context.asAbsolutePath(
    path.join("server", "out", "index.js")
  );

  const outputChannel: OutputChannel = window.createOutputChannel("Hardhat");
  const commandsOutputChannel: OutputChannel =
    window.createOutputChannel("Hardhat Commands");
  const telemetry = new SentryClientTelemetry(sentryDsn);
  const logger = new Logger(outputChannel, telemetry);

  const extensionState: ExtensionState = {
    context,
    env:
      process.env.NODE_ENV === "development"
        ? process.env.NODE_ENV
        : "production",
    version: context.extension.packageJSON.version,
    name: context.extension.packageJSON.name,
    serverModulePath,
    machineId: env.machineId,

    client: null,
    listenerDisposables: [],
    currentIndexingJobs: [],
    projectsValidationStatus: {},
    hardhatTelemetryEnabled:
      workspace.getConfiguration("hardhat").get<boolean>("telemetry") ?? false,
    globalTelemetryEnabled: env.isTelemetryEnabled,
    hardhatConfigStatusItem: null,

    telemetry,
    outputChannel,
    commandsOutputChannel,
    logger,
  };

  telemetry.init(extensionState);

  return extensionState;
}

import { ExtensionContext, LanguageClient, services } from "coc.nvim";
import * as coc from "coc.nvim";
import * as packageJson from "../package.json";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { machineId } = require("./vendor/machineId");

export async function activate(context: ExtensionContext): Promise<void> {
  await showTelemetryPrompt(context);

  const telemetryEnabled =
    getExtensionConfig().get<boolean>("telemetry") ?? false;

  const languageClient = new LanguageClient(
    "solidity",
    "Solidity Language Server",
    {
      module: require.resolve("@nomicfoundation/solidity-language-server"),
      transport: coc.TransportKind.ipc,
    },
    {
      documentSelector: ["solidity"],
      synchronize: {
        configurationSection: "solidity",
        fileEvents: [
          coc.workspace.createFileSystemWatcher("**/hardhat.config.{ts,js}"),
          coc.workspace.createFileSystemWatcher("**/foundry.toml"),
          coc.workspace.createFileSystemWatcher(
            "**/{truffle-config,truffle}.js"
          ),
          coc.workspace.createFileSystemWatcher("**/remappings.txt"),
          coc.workspace.createFileSystemWatcher("**/*.sol"),
        ],
      },
      initializationOptions: {
        extensionName: "@nomicfoundation/coc-solidity",
        extensionVersion: packageJson.version,
        env: "production",
        telemetryEnabled,
        machineId: await machineId(),
        extensionConfig: getExtensionConfig(),
      },
    }
  );
  context.subscriptions.push(services.registLanguageClient(languageClient));
}

async function showTelemetryPrompt(context: ExtensionContext) {
  const shownTelemetryPrompt = context.globalState.get("shownTelemetryPrompt");

  if (!shownTelemetryPrompt) {
    const pick = await coc.window.showMenuPicker(
      ["Accept", "Decline"],
      "Support coc-solidity with crash reports?"
    );

    switch (pick) {
      case 0:
        getExtensionConfig().update("telemetry", true, true);
        return context.globalState.update("shownTelemetryPrompt", true);
      case 1:
        getExtensionConfig().update("telemetry", false, true);
        return context.globalState.update("shownTelemetryPrompt", true);
      default:
        break;
    }
  }
}

function getExtensionConfig() {
  return coc.workspace.getConfiguration("@nomicfoundation/coc-solidity");
}

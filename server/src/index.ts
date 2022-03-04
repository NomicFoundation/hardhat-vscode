import "module-alias/register";
import { createConnection, ProposedFeatures } from "vscode-languageserver/node";
import setupServer from "./server";
import { compilerProcessFactory } from "@services/validation/compilerProcessFactory";
import { ConnectionLogger } from "@utils/Logger";
import { WorkspaceFileRetriever } from "@analyzer/WorkspaceFileRetriever";
import { SentryTelemetry } from "./telemetry/SentryTelemetry";
import { GoogleAnalytics } from "./analytics/GoogleAnalytics";

const GOOGLE_TRACKING_ID = "UA-117668706-4";

const SENTRY_DSN =
  "https://9d1e887190db400791c77d9bb5a154fd@o385026.ingest.sentry.io/5469451";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

const workspaceFileRetriever = new WorkspaceFileRetriever();
const telemetry = new SentryTelemetry(SENTRY_DSN);
const analytics = new GoogleAnalytics(GOOGLE_TRACKING_ID);
const logger = new ConnectionLogger(connection, telemetry);

setupServer(
  connection,
  compilerProcessFactory,
  workspaceFileRetriever,
  analytics,
  telemetry,
  logger
);

// Listen on the connection
connection.listen();

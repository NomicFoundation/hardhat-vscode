#!/usr/bin/env node
/* istanbul ignore file: setup file */

import { addAliases } from "module-alias";
addAliases({
  "@compilerDiagnostics": `${__dirname}/compilerDiagnostics/`,
  "@analyzer": `${__dirname}/parser/analyzer/`,
  "@common": `${__dirname}/parser/common/`,
  "@services": `${__dirname}/services/`,
  "@utils": `${__dirname}/utils/`,
});

import { createConnection, ProposedFeatures } from "vscode-languageserver/node";
import { ConnectionLogger } from "@utils/Logger";
import { WorkspaceFileRetriever } from "@utils/WorkspaceFileRetriever";
import setupServer from "./server";
import { SentryServerTelemetry } from "./telemetry/SentryServerTelemetry";
import { GoogleAnalytics } from "./analytics/GoogleAnalytics";

const GOOGLE_TRACKING_ID = "UA-117668706-4";

const SENTRY_DSN =
  "https://9d1e887190db400791c77d9bb5a154fd@o385026.ingest.sentry.io/5469451";

// every 10 mins (ga sessions stop with 30mins inactivty)
const HEARTBEAT_PERIOD = 10 * 60 * 1000;

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

const workspaceFileRetriever = new WorkspaceFileRetriever();
const analytics = new GoogleAnalytics(GOOGLE_TRACKING_ID);
const telemetry = new SentryServerTelemetry(
  SENTRY_DSN,
  HEARTBEAT_PERIOD,
  analytics
);
const logger = new ConnectionLogger(connection, telemetry);

setupServer(connection, workspaceFileRetriever, telemetry, logger);

// Listen on the connection
connection.listen();

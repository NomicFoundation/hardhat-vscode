#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */
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
import {
  SOLIDITY_GA_SECRET,
  SOLIDITY_GOOGLE_TRACKING_ID,
  SOLIDITY_SENTRY_DSN,
  HEARTBEAT_PERIOD,
} from "./constants";
import setupServer from "./server";
import { SentryServerTelemetry } from "./telemetry/SentryServerTelemetry";
import { GoogleAnalytics } from "./analytics/GoogleAnalytics";

import "es-iterator-helpers/auto"; // polyfill for Iterator for Node < 22

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

const workspaceFileRetriever = new WorkspaceFileRetriever();
const analytics = new GoogleAnalytics(
  SOLIDITY_GOOGLE_TRACKING_ID,
  SOLIDITY_GA_SECRET
);
const telemetry = new SentryServerTelemetry(
  SOLIDITY_SENTRY_DSN,
  HEARTBEAT_PERIOD,
  analytics
);
const logger = new ConnectionLogger(connection, telemetry);

setupServer(connection, workspaceFileRetriever, telemetry, logger);

// Listen on the connection
connection.listen();

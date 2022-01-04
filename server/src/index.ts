import "module-alias/register";
import * as Sentry from "@sentry/node";
import { createConnection, ProposedFeatures } from "vscode-languageserver/node";
import setupServer from "./server";
import { compilerProcessFactory } from "@services/validation/compilerProcessFactory";

Sentry.init({
  // Sentry DSN. I guess there's no other choice than keeping it here.
  dsn: "https://9d1e887190db400791c77d9bb5a154fd@o385026.ingest.sentry.io/5469451",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 0.1,
});

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

setupServer(connection, compilerProcessFactory);

// Listen on the connection
connection.listen();

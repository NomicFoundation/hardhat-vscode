import path from "node:path";

/**
 * Every path the bundles use is resolved from this file, not from the cwd.
 * The scripts are run by `pnpm` from inside `client/` and `server/`, so a
 * relative path would keep working — but only for as long as nobody runs them
 * from anywhere else.
 */
export const ROOT_DIR = path.resolve(import.meta.dirname, "..", "..", "..");

export const CLIENT_DIR = path.join(ROOT_DIR, "client");

export const SERVER_DIR = path.join(ROOT_DIR, "server");

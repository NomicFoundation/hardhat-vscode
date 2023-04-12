// Google Analytics
export const SOLIDITY_GA_SECRET = process.env.SOLIDITY_GA_SECRET ?? "";
export const SOLIDITY_GOOGLE_TRACKING_ID =
  process.env.SOLIDITY_GOOGLE_TRACKING_ID ?? "";

// every 10 mins (ga sessions stop with 30mins inactivty)
export const HEARTBEAT_PERIOD = 10 * 60 * 1000;

// Sentry
export const SOLIDITY_SENTRY_DSN = process.env.SOLIDITY_SENTRY_DSN ?? "";

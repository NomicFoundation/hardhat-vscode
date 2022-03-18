import { ServerState } from "../types";

export type AnalyticsData = {
  clientId: string;
  isAllowed?: boolean;
};

// VERY IMPORTANT:
// The documentation doesn't say so, but the user-agent parameter is required (ua).
// If you don't send it, you won't get an error or anything, Google will *silently* drop your hit.
//
// https://stackoverflow.com/questions/27357954/google-analytics-measurement-protocol-not-working
export interface DefaultRawAnalyticsPayload {
  v: "1";
  tid: string;
  ua: string;
  cid: string;
  t: string;
  dp: string;
  cd1: string;
}

export interface RawAnalyticsPayload {
  // Specifies the time it took for a page to load. The value is in milliseconds.
  plt?: number;
}

export interface AnalyticsPayload
  extends DefaultRawAnalyticsPayload,
    RawAnalyticsPayload {}

export interface Analytics {
  init(
    trackingId: string | undefined,
    extensionVersion: string | undefined,
    serverState: ServerState
  ): void;

  sendPageView(taskName: string, more?: RawAnalyticsPayload): Promise<void>;
}
